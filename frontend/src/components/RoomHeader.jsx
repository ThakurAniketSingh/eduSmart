import { Code2, Copy, Check, LogOut, Wifi, WifiOff, Sun, Moon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../hooks/useTheme.jsx'

export default function RoomHeader({ roomName, roomCode, participantCount, connectionStatus, onLeave, isAdmin, onDelete }) {
  const [copied, setCopied] = useState(false)
  const { theme, toggleTheme } = useTheme()

  function handleCopy() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header
      className="flex h-14 shrink-0 items-center transition-colors"
      style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' }}
    >
      {/* Left — matches left sidebar (w-64) */}
      <div className="hidden lg:flex items-center gap-2.5 w-64 shrink-0 px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-signal-500 to-violet-600 text-white shadow-sm">
          <Code2 className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>eduSmart</span>
      </div>

      {/* Mobile brand (visible only on small screens) */}
      <div className="flex lg:hidden items-center gap-2 px-4 shrink-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-signal-500 to-violet-600 text-white shadow-sm">
          <Code2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </div>

      {/* Center — mirrors editor (50%) | console (50%) */}
      <div className="flex flex-1 items-center min-w-0">
        <div className="flex flex-1 items-center justify-end pr-3 min-w-0">
          <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{roomName}</span>
        </div>
        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>|</span>
        <div className="flex flex-1 items-center pl-3 min-w-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-mono transition-colors shrink-0 hover:bg-violet-500/10"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            {roomCode}
            {copied ? <Check className="h-3 w-3 text-signal-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Right — matches right sidebar (w-64) */}
      <div className="flex items-center gap-2 lg:gap-3 lg:w-64 shrink-0 justify-end px-4">
        <span
          className={`hidden sm:flex items-center gap-1.5 text-xs ${
            connectionStatus === 'connected' ? 'text-signal-400' : 'text-amber-400'
          }`}
        >
          {connectionStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connectionStatus === 'connected' ? 'Live' : 'Reconnecting...'}
        </span>
        <span className="text-xs hidden md:inline whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{participantCount} online</span>
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 transition-colors hover:bg-violet-500/10"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Leave</span>
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
            style={{ border: '1px solid var(--border-color)' }}
            title="Delete Classroom"
          >
            <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>
    </header>
  )
}
