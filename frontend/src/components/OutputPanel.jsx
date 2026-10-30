import { SquareSquare } from 'lucide-react'
import Terminal from './Terminal.jsx'
import { useTheme } from '../hooks/useTheme.jsx'

export default function OutputPanel({ terminalRef, onTerminalInput, isRunning, onStop }) {
  const { theme } = useTheme()
  return (
    <div className="flex h-full flex-col relative" style={{ backgroundColor: theme === 'dark' ? '#000000' : '#E2E8F0' }}>
      {isRunning && (
        <button
          onClick={onStop}
          className="absolute top-2 right-4 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-rose-500 bg-white hover:bg-rose-50 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-colors shadow-sm"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <SquareSquare className="h-3 w-3" /> Stop
        </button>
      )}
      <Terminal ref={terminalRef} onInput={onTerminalInput} />
    </div>
  )
}
