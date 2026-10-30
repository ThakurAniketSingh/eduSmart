import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { roomApi } from '../services/api.js'
import { useToast } from '../hooks/useToast.jsx'
import { SESSION_KEY } from '../utils/constants.js'

export default function JoinClassroomPage() {
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const toast = useToast()

  function validate() {
    const next = {}
    if (!displayName.trim()) next.displayName = 'Display name is required'
    if (!roomCode.trim()) next.roomCode = 'Room code is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const room = await roomApi.join({ displayName, roomCode: roomCode.trim().toUpperCase() })
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ displayName, role: 'USER', roomCode: room.roomCode }),
      )
      toast.success(`Joined ${room.roomName}.`)
      navigate(`/classroom/${room.roomCode}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen transition-colors" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <Navbar />
      <div className="flex-1 w-full mx-auto flex max-w-lg flex-col justify-center px-4 py-12 sm:px-6 md:py-20">
        <button
          onClick={() => navigate('/')}
          className="mb-6 self-start inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-violet-500"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <h1 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>Join a classroom</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Enter the room code your admin shared with you.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Anita Verma"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.displayName ? '#f43f5e' : 'var(--input-border)'}`,
                color: 'var(--text-primary)',
              }}
            />
            {errors.displayName && <p className="mt-1.5 text-xs text-rose-500">{errors.displayName}</p>}
          </div>

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. EDU482"
              maxLength={6}
              className="w-full rounded-lg font-mono text-sm tracking-widest px-4 py-2.5 outline-none transition-all"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: `1px solid ${errors.roomCode ? '#f43f5e' : 'var(--input-border)'}`,
                color: 'var(--text-primary)',
              }}
            />
            {errors.roomCode && <p className="mt-1.5 text-xs text-rose-500">{errors.roomCode}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Joining...' : 'Join Classroom'}
          </button>
        </form>
      </div>
    </div>
  )
}
