import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, ArrowRight, Loader2, Share2, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { roomApi } from '../services/api.js'
import { useToast } from '../hooks/useToast.jsx'
import { SESSION_KEY } from '../utils/constants.js'

export default function CreateClassroomPage() {
  const [adminName, setAdminName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [room, setRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const toast = useToast()

  function validate() {
    const next = {}
    if (!adminName.trim()) next.adminName = 'Your name is required'
    if (!roomName.trim()) next.roomName = 'Classroom name is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const created = await roomApi.create({ adminName, roomName })
      setRoom(created)
      toast.success('Classroom created successfully.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(room.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleShare() {
    const text = `Join my EduSmart classroom!\n\nRoom Name: ${room.roomName}\nRoom Code: ${room.roomCode}\n\nJoin here: ${window.location.origin}/join`
    
    // Use native share menu if available (mobile & some desktops)
    if (navigator.share) {
      navigator.share({
        title: 'Join EduSmart Classroom',
        text: text,
      }).catch(console.error)
    } else {
      // Fallback: Copy full message to clipboard
      navigator.clipboard.writeText(text)
      toast.success('Share text copied to clipboard!')
    }
  }

  function handleEnter() {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ displayName: room.adminName, role: 'ADMIN', roomCode: room.roomCode }),
    )
    navigate(`/classroom/${room.roomCode}`)
  }

  return (
    <div className="flex flex-col min-h-screen transition-colors" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <Navbar />
      <div className="flex-1 w-full mx-auto flex max-w-lg flex-col justify-center px-4 py-12 sm:px-6 md:py-20">
        {!room ? (
          <>
            <button
              onClick={() => navigate('/')}
              className="mb-6 self-start inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-violet-500"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            <h1 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>Create a classroom</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              You&apos;ll get a unique room code that students can use to join.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div>
                <label htmlFor="adminName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Admin Name
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Sharma"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: `1px solid ${errors.adminName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.adminName && <p className="mt-1.5 text-xs text-rose-500">{errors.adminName}</p>}
              </div>

              <div>
                <label htmlFor="roomName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Classroom Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Data Structures 101"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: `1px solid ${errors.roomName ? '#f43f5e' : 'var(--input-border)'}`,
                    color: 'var(--text-primary)',
                  }}
                />
                {errors.roomName && <p className="mt-1.5 text-xs text-rose-500">{errors.roomName}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Creating...' : 'Create Classroom'}
              </button>
            </form>
          </>
        ) : (
          <div
            className="animate-slide-up rounded-2xl p-8 text-center"
            style={{
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            }}
          >
            <p className="text-sm font-medium text-signal-500">Classroom Created Successfully</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{room.roomName}</p>

            <p className="mt-6 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Room Code</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="font-mono text-4xl tracking-[0.2em]" style={{ color: 'var(--text-primary)' }}>{room.roomCode}</span>
              <button
                onClick={handleCopy}
                aria-label="Copy room code"
                className="rounded-md p-2 transition-colors hover:bg-violet-500/10"
                style={{ color: 'var(--text-muted)' }}
              >
                {copied ? <Check className="h-4 w-4 text-signal-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="mt-6 mx-auto flex items-center justify-center gap-2 rounded-xl border-2 border-violet-100 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 px-6 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:scale-[1.02] active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              Share Room
            </button>

            <button
              onClick={handleEnter}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              Enter Classroom
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
