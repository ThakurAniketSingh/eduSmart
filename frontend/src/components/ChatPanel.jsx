import { useEffect, useRef, useState } from 'react'
import { Send, Mic, Square, Paperclip, CheckCheck, Trash2, Copy, X, Maximize2, Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useTheme } from '../hooks/useTheme'
import CustomAudioPlayer from './CustomAudioPlayer'
import { mediaApi } from '../services/api'
import { API_BASE_URL } from '../utils/constants'

const BASE_URL = API_BASE_URL.replace(/\/api$/, '')
function getMediaUrl(urlStr) {
  if (!urlStr) return ''
  if (urlStr.startsWith('data:')) return urlStr // Legacy base64 support
  return urlStr.startsWith('http') ? urlStr : BASE_URL + urlStr
}

export default function ChatPanel({ messages, onSend, onDeleteMessage, currentUser, participants = [] }) {
  const [draft, setDraft] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [, setTickRefresh] = useState(0)
  const scrollRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const { theme } = useTheme()
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null)
  const longPressTimer = useRef(null)

  // Delete Confirmation Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Fullscreen Media State
  const [fullscreenMedia, setFullscreenMedia] = useState(null)

  // Media Preview State
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [isCompressing, setIsCompressing] = useState(false)

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Force re-render for blue ticks simulation
  useEffect(() => {
    const interval = setInterval(() => setTickRefresh(r => r + 1), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    onSend(JSON.stringify({ type: 'text', data: draft.trim() }))
    setDraft('')
  }

  // --- Voice Recording ---
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          onSend(JSON.stringify({ type: 'audio', data: reader.result }))
        }
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // --- Image Upload with Compression ---
  const fileInputRef = useRef(null)

  // File Handlers


  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      setSelectedMedia({ file, url: URL.createObjectURL(file), type: 'image', caption: '' })
    } else {
      alert('Only images are supported.')
    }
    e.target.value = ''
  }

  async function handleSendMedia() {
    if (!selectedMedia) return
    setIsCompressing(true) // Reusing state for upload indicator
    
    try {
      const res = await mediaApi.upload(selectedMedia.file)
      onSend(JSON.stringify({ 
        type: selectedMedia.type, 
        url: res.url, 
        caption: selectedMedia.caption 
      }))
    } catch (err) {
      console.error(err)
      alert('Failed to upload media. Please try again.')
    } finally {
      setIsCompressing(false)
      setSelectedMedia(null)
      URL.revokeObjectURL(selectedMedia.url)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3 chat-bg-pattern">
        {messages.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hello!</p>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender === currentUser
          const senderParticipant = participants.find(p => p.displayName === m.sender)
          const isAdmin = senderParticipant?.role === 'ADMIN'
          
          let msgObj = null
          try {
            const parsed = JSON.parse(m.message)
            if (parsed && parsed.type && (parsed.data || parsed.url)) {
              msgObj = parsed
            }
          } catch (e) {
            // normal text
          }

          // Fixed colors and gradients for user and admin
          const avatarGradient = isAdmin 
            ? 'linear-gradient(to bottom right, #8b5cf6, #d946ef)' // Violet to Fuchsia
            : 'linear-gradient(to bottom right, #3b82f6, #06b6d4)' // Blue to Cyan
          const nameColor = isAdmin ? '#8b5cf6' : '#0284c7' // Violet 500 : Sky 600
          
          // Faux read receipt: blue if older than 2 seconds
          const isRead = m.timestamp && (new Date().getTime() - new Date(m.timestamp).getTime() > 2000)

          const currentUserParticipant = participants.find(p => p.displayName === currentUser)
          const isCurrentUserAdmin = currentUserParticipant?.role === 'ADMIN'
          const canDelete = isMe || isCurrentUserAdmin
          const isText = !msgObj || msgObj.type === 'text'

          return (
            <div 
              key={m.id ?? i} 
              className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
              onContextMenu={(e) => {
                if (m.isDeleted) return
                e.preventDefault()
                if (canDelete || isText) {
                  setContextMenu({ x: e.clientX, y: e.clientY, m, canDelete, isText, msgObj })
                }
              }}
              onTouchStart={(e) => {
                if (m.isDeleted) return
                if (!canDelete && !isText) return
                longPressTimer.current = setTimeout(() => {
                  setContextMenu({ x: e.touches[0].clientX, y: e.touches[0].clientY, m, canDelete, isText, msgObj })
                }, 500)
              }}
              onTouchEnd={() => clearTimeout(longPressTimer.current)}
              onTouchMove={() => clearTimeout(longPressTimer.current)}
            >
              
              {!isMe && (
                <div className="shrink-0 mr-2 self-end mb-1">
                  <div 
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundImage: avatarGradient }}
                  >
                    {m.sender.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              <div
                className={`relative max-w-[75%] px-3 py-1.5 text-[14px] leading-snug shadow-sm ${
                  isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
                }`}
                style={{
                  backgroundColor: isMe ? 'var(--chat-bubble-me)' : 'var(--chat-bubble-other)',
                  color: 'var(--text-primary)',
                }}
              >
                {!isMe && (
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: nameColor }}>
                    {m.sender}
                  </p>
                )}
                
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <div className="flex-1 min-w-0">
                    {m.isDeleted ? (
                      <p className="whitespace-pre-wrap break-words italic flex items-center gap-1.5 opacity-70">
                        <span className="text-[14px]">🚫</span>
                        {m.deletedByRole === 'ADMIN' ? 'This message was deleted by Admin' : 'This message was deleted'}
                      </p>
                    ) : msgObj ? (
                      msgObj.type === 'audio' ? (
                        <CustomAudioPlayer src={msgObj.data} />
                      ) : msgObj.type === 'image' ? (
                        <div className="flex flex-col gap-1">
                          <div 
                            className="relative cursor-pointer group mt-1 mb-1" 
                            onClick={() => setFullscreenMedia({ type: 'image', src: getMediaUrl(msgObj.url || msgObj.data) })}
                          >
                            <img src={getMediaUrl(msgObj.url || msgObj.data)} alt="Attachment" className="max-w-full rounded" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                              <Maximize2 className="text-white w-6 h-6" />
                            </div>
                          </div>
                          {msgObj.caption && <p className="text-[14px] whitespace-pre-wrap break-words">{msgObj.caption}</p>}
                        </div>
                      ) : msgObj.type === 'video' ? (
                        <div className="flex flex-col gap-1">
                          <div 
                            className="relative cursor-pointer group mt-1 mb-1"
                            onClick={() => setFullscreenMedia({ type: 'video', src: getMediaUrl(msgObj.url || msgObj.data) })}
                          >
                            {/* Preload metadata enables seeking and poster frame rendering */}
                            <video src={getMediaUrl(msgObj.url || msgObj.data)} preload="metadata" controls className="max-w-full rounded" style={{ maxHeight: '250px', objectFit: 'cover' }} />
                          </div>
                          {msgObj.caption && <p className="text-[14px] whitespace-pre-wrap break-words">{msgObj.caption}</p>}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msgObj.data}</p>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-60 self-end shrink-0 relative top-[2px] mb-0.5">
                    <span className="text-[10px] whitespace-nowrap">
                      {formatTime(m.timestamp)}
                    </span>
                    {isMe && <CheckCheck className={`h-3.5 w-3.5 ${isRead ? 'text-blue-500' : 'text-slate-400'}`} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[120px]"
          style={{ 
            top: Math.min(contextMenu.y, window.innerHeight - 100), 
            left: Math.min(contextMenu.x, window.innerWidth - 150) 
          }}
        >
          {contextMenu.isText && !contextMenu.m.isDeleted && (
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
              onClick={() => {
                const textToCopy = contextMenu.msgObj ? contextMenu.msgObj.data : contextMenu.m.message
                if (textToCopy) navigator.clipboard.writeText(textToCopy)
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          )}
          {contextMenu.canDelete && contextMenu.m.id && !contextMenu.m.isDeleted && (
            <button 
              className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
              onClick={() => setDeleteConfirmId(contextMenu.m.id)}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      )}

      {selectedMedia && (
        <div className="fixed inset-0 z-[250] flex flex-col items-center justify-between bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="w-full p-4 flex justify-between items-center bg-gradient-to-b from-slate-900/80 to-transparent">
            <h3 className="text-white font-medium text-lg px-2 drop-shadow-md">Send Image</h3>
            <button 
              onClick={() => {
                URL.revokeObjectURL(selectedMedia.url)
                setSelectedMedia(null)
              }}
              disabled={isCompressing}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Preview Image */}
          <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-8 min-h-0">
            <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
              <img 
                src={selectedMedia.url} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
              />
            </div>
          </div>

          {/* Caption Input & Action */}
          <div className="w-full max-w-3xl px-4 pb-8 sm:pb-12 pt-4">
            <div className="flex items-end gap-3 p-2 bg-slate-800/60 backdrop-blur-md border border-slate-600/50 rounded-[28px] shadow-2xl">
              <textarea 
                rows={1}
                placeholder="Add a caption..."
                value={selectedMedia.caption}
                onChange={(e) => setSelectedMedia({ ...selectedMedia, caption: e.target.value })}
                disabled={isCompressing}
                className="flex-1 bg-transparent text-white placeholder-slate-400 px-4 py-3 outline-none resize-none overflow-hidden min-h-[48px] max-h-[120px] scrollbar-thin"
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button 
                onClick={handleSendMedia}
                disabled={isCompressing}
                className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isCompressing ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <button 
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full h-full p-8 flex items-center justify-center" onClick={() => setFullscreenMedia(null)}>
            {fullscreenMedia.type === 'image' ? (
              <img 
                src={fullscreenMedia.src} 
                alt="Fullscreen Media" 
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video 
                src={fullscreenMedia.src} 
                controls 
                autoPlay 
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Message</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onDeleteMessage && onDeleteMessage(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-1.5 p-2 sm:p-3" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-secondary)' }}>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Attach Image"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <div className="relative flex items-center" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0 rounded-full p-2 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Add Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-[100]">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setDraft((prev) => prev + emojiData.emoji)
                }}
                lazyLoadEmojis={true}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message..."
            className="w-full min-w-0 rounded-full px-3 sm:px-4 py-2 text-sm outline-none transition-all shadow-sm"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {draft.trim() ? (
          <button
            type="submit"
            className="shrink-0 rounded-full bg-violet-500 p-2 text-white hover:bg-violet-400 transition-colors shadow-sm"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        ) : isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="shrink-0 rounded-full bg-rose-500 p-2 text-white hover:bg-rose-400 transition-colors shadow-sm animate-pulse"
            title="Stop Recording"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="shrink-0 rounded-full p-2 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Record Voice Note"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  )
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
