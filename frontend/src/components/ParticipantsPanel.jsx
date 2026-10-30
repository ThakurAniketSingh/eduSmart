import { ShieldCheck, MoreVertical, Check, Shield, User } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal.jsx'
import api from '../services/api.js'
import { useToast } from '../hooks/useToast.jsx'

export default function ParticipantsPanel({ participants, currentUser, isAdmin, roomCode }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [globalUpdates, setGlobalUpdates] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)
  const toast = useToast()

  // Ensure unique list of participants by displayName
  const uniqueParticipants = (() => {
    const list = []
    const seen = new Set()
    for (const p of (participants || [])) {
      if (p?.displayName && !seen.has(p.displayName)) {
        seen.add(p.displayName)
        list.push(p)
      }
    }
    return list
  })()
  
  // Helper to get initials (1 letter only)
  const getInitials = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const openPermissionsModal = (user) => {
    setSelectedUser(user)
    setPermissions({
      canDraw: user.canDraw ?? false,
      canCreateFile: user.canCreateFile ?? false,
      canEditFile: user.canEditFile ?? false,
      canDeleteFile: user.canDeleteFile ?? false,
    })
  }

  const openGlobalPermissionsModal = () => {
    setSelectedUser('GLOBAL')
    
    const users = uniqueParticipants.filter(p => p.role !== 'ADMIN')
    const allHaveDraw = users.length > 0 && users.every(p => p.canDraw)
    const allHaveCreate = users.length > 0 && users.every(p => p.canCreateFile)
    const allHaveEdit = users.length > 0 && users.every(p => p.canEditFile)
    const allHaveDelete = users.length > 0 && users.every(p => p.canDeleteFile)

    setPermissions({
      canDraw: allHaveDraw,
      canCreateFile: allHaveCreate,
      canEditFile: allHaveEdit,
      canDeleteFile: allHaveDelete,
    })
    setGlobalUpdates({})
  }

  const handleSavePermissions = async () => {
    if (!selectedUser || !permissions) return
    
    if (selectedUser === 'GLOBAL' && Object.keys(globalUpdates).length === 0) {
      toast.info('No changes made to global permissions.')
      setSelectedUser(null)
      return
    }

    setIsUpdating(true)
    try {
      if (selectedUser === 'GLOBAL') {
        await api.put(`/rooms/${roomCode}/participants/global/permissions`, globalUpdates)
        toast.success(`Global permissions updated for all users`)
      } else {
        await api.put(`/rooms/${roomCode}/participants/${encodeURIComponent(selectedUser.displayName)}/permissions`, permissions)
        toast.success(`Permissions updated for ${selectedUser.displayName}`)
      }
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update permissions', error)
      toast.error('Failed to update permissions')
    } finally {
      setIsUpdating(false)
    }
  }

  const togglePermission = (key) => {
    setPermissions(prev => {
      const newValue = !prev[key]
      if (selectedUser === 'GLOBAL') {
        setGlobalUpdates(gu => ({ ...gu, [key]: newValue }))
      }
      return { ...prev, [key]: newValue }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 h-[42px] items-center px-4 justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Participants ({uniqueParticipants.length})
        </h2>
      </div>
      
      {isAdmin && (
        <div className="flex shrink-0 p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <button 
             onClick={openGlobalPermissionsModal}
             className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors"
          >
             <Shield className="h-4 w-4" />
             <span className="text-[11px] font-bold uppercase tracking-wider">Manage All Permissions</span>
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 flex flex-col gap-1">
        {uniqueParticipants.length === 0 && (
          <p className="px-2 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No one else is here yet.</p>
        )}
        
        {(() => {
          const sortedParticipants = [...uniqueParticipants].sort((a, b) => {
            // 1. Admin always at the top
            if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
            if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
            
            // 2. "You" (current user) comes next
            if (a.displayName === currentUser && b.displayName !== currentUser) return -1;
            if (b.displayName === currentUser && a.displayName !== currentUser) return 1;
            
            // 3. Alphabetical order for the rest
            return a.displayName.localeCompare(b.displayName);
          });

          return sortedParticipants.map((p) => {
          const isMe = p.displayName === currentUser;
          const isAdminUser = p.role === 'ADMIN';
          
          return (
            <div 
              key={p.displayName} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isMe ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              {/* Avatar with Online Indicator */}
              <div className="relative shrink-0">
                <div 
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm`}
                  style={{ backgroundImage: isAdminUser ? 'linear-gradient(to bottom right, #8b5cf6, #d946ef)' : 'linear-gradient(to bottom right, #3b82f6, #06b6d4)' }}
                >
                  {getInitials(p.displayName)}
                </div>
                {/* Green online dot */}
                <div className="absolute bottom-0 right-0 translate-x-[20%] translate-y-[20%] h-2.5 w-2.5 rounded-full bg-signal-500 ring-2 ring-white dark:ring-[#1e1e2e]" />
              </div>

              {/* Name and Role */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {p.displayName}
                  </span>
                  {isMe && (
                    <span className="shrink-0 text-[10px] font-semibold tracking-wide text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      YOU
                    </span>
                  )}
                </div>
                {isAdminUser ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-violet-500" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-violet-500">Admin</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500">User</span>
                  </div>
                )}
              </div>

              {/* Admin 3-dot menu */}
              {isAdmin && !isAdminUser && (
                <button
                  onClick={() => openPermissionsModal(p)}
                  className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title="Manage Permissions"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            </div>
          )
          })
        })()}
      </div>

      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser === 'GLOBAL' ? 'Permissions: All Users' : `Permissions: ${selectedUser?.displayName}`}
        footer={
          <>
            <button
              onClick={() => setSelectedUser(null)}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={isUpdating}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {selectedUser === 'GLOBAL' 
              ? 'Toggle what all users are allowed to do in the classroom. This will overwrite their individual permissions.'
              : 'Toggle what this user is allowed to do in the classroom.'}
          </p>
          
          <PermissionToggle 
            label="Draw on Whiteboard" 
            enabled={permissions?.canDraw} 
            onChange={() => togglePermission('canDraw')} 
          />
          <PermissionToggle 
            label="Create Code Files" 
            enabled={permissions?.canCreateFile} 
            onChange={() => togglePermission('canCreateFile')} 
          />
          <PermissionToggle 
            label="Edit Code Files" 
            enabled={permissions?.canEditFile} 
            onChange={() => togglePermission('canEditFile')} 
          />
          <PermissionToggle 
            label="Delete Code Files" 
            enabled={permissions?.canDeleteFile} 
            onChange={() => togglePermission('canDeleteFile')} 
          />
        </div>
      </Modal>
    </div>
  )
}

function PermissionToggle({ label, enabled, onChange }) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-secondary)' }}
      onClick={onChange}
    >
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div 
        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
          enabled 
            ? 'bg-violet-500 border-violet-500' 
            : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {enabled && <Check className="h-3.5 w-3.5 text-white" />}
      </div>
    </div>
  )
}
