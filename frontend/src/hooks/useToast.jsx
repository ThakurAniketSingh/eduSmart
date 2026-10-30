import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Toast from '../components/Toast.jsx'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, variant = 'default', duration = 3500) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, variant }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      show: notify,
      success: (msg, duration) => notify(msg, 'success', duration),
      error: (msg, duration) => notify(msg, 'error', duration),
      info: (msg, duration) => notify(msg, 'default', duration),
    }),
    [notify],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} variant={t.variant} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
