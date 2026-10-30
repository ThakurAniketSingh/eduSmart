import { WS_BASE_URL } from '../utils/constants'

/**
 * Wraps the native WebSocket API for a single room connection.
 *
 * Usage:
 *   const socket = new RoomSocket(roomCode, displayName, role)
 *   const unsubscribe = socket.on('CHAT', (msg) => ...)
 *   socket.send('CHAT', { message: 'hi' })
 *   socket.close()
 */
export class RoomSocket {
  constructor(roomCode, displayName, role) {
    this.roomCode = roomCode
    this.displayName = displayName
    this.role = role
    this.listeners = new Map() // type -> Set<handler>
    this.statusListeners = new Set()
    this.socket = null
    this.shouldReconnect = true
    this.reconnectAttempts = 0
    this._connect()
  }

  _connect() {
    const url = `${WS_BASE_URL}/room/${this.roomCode}?displayName=${encodeURIComponent(
      this.displayName,
    )}&role=${encodeURIComponent(this.role)}`

    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this._emitStatus('connected')
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const handlers = this.listeners.get(message.type)
        if (handlers) {
          handlers.forEach((handler) => handler(message))
        }
      } catch {
        // Ignore malformed frames rather than crashing the whole session.
      }
    }

    this.socket.onclose = () => {
      this._emitStatus('disconnected')
      if (this.shouldReconnect) {
        this.reconnectAttempts += 1
        const delay = Math.min(1000 * this.reconnectAttempts, 5000)
        setTimeout(() => {
          if (this.shouldReconnect) this._connect()
        }, delay)
      }
    }

    this.socket.onerror = () => {
      this._emitStatus('error')
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type).add(handler)
    return () => this.listeners.get(type)?.delete(handler)
  }

  onStatusChange(handler) {
    this.statusListeners.add(handler)
    return () => this.statusListeners.delete(handler)
  }

  _emitStatus(status) {
    this.statusListeners.forEach((handler) => handler(status))
  }

  send(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type,
          sender: this.displayName,
          payload,
        }),
      )
      return true
    }
    return false
  }

  close() {
    this.shouldReconnect = false
    this.socket?.close()
  }
}
