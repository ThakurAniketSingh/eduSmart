import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm animate-fade-in"
        style={{ backgroundColor: 'var(--modal-backdrop)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md animate-slide-up rounded-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin"
        style={{
          backgroundColor: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display text-xl pr-4" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors rounded-md p-1 hover:bg-violet-500/10 shrink-0"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
