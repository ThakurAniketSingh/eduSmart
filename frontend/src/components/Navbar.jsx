import { Link } from 'react-router-dom'
import { Code2, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--header-bg)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-signal-500 to-violet-600 text-white shadow-md">
            <Code2 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>eduSmart</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2.5 transition-colors hover:bg-violet-500/10"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </header>
  )
}
