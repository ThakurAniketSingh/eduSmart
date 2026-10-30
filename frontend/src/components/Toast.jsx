import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'text-signal-400',
    ring: 'ring-signal-500/20',
  },
  error: {
    icon: AlertCircle,
    accent: 'text-rose-400',
    ring: 'ring-rose-500/20',
  },
  default: {
    icon: Info,
    accent: 'text-violet-400',
    ring: 'ring-violet-500/20',
  },
}

export default function Toast({ message, variant = 'default', onClose }) {
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default
  const Icon = style.icon

  return (
    <div
      role="status"
      className={`animate-slide-up flex items-start gap-3 rounded-xl ring-1 ${style.ring} px-4 py-3 backdrop-blur max-w-sm`}
      style={{
        backgroundColor: 'var(--toast-bg)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.2)',
      }}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.accent}`} />
      <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{message}</p>
      <button
        onClick={onClose}
        className="ml-auto transition-colors hover:bg-violet-500/10 rounded-md p-0.5"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
