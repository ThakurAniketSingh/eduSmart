import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useTheme } from '../hooks/useTheme.jsx'
import 'xterm/css/xterm.css'

const Terminal = forwardRef(({ onInput }, ref) => {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const { theme } = useTheme()
  
  const onInputRef = useRef(onInput)
  useEffect(() => {
    onInputRef.current = onInput
  }, [onInput])

  useImperativeHandle(ref, () => ({
    write: (data) => {
      xtermRef.current?.write(data)
    },
    clear: () => {
      xtermRef.current?.clear()
    },
    fit: () => {
      fitAddonRef.current?.fit()
    },
  }))

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0F172A', // Initial dark, will update immediately
        foreground: '#F8FAFC',
        cursor: '#8B5CF6',
        selectionBackground: 'rgba(255, 255, 255, 0.1)'
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14,
      convertEol: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const disposable = term.onData((data) => {
      if (onInputRef.current) onInputRef.current(data)
    })

    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      disposable.dispose()
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, []) // Mount only once

  // Update theme dynamically with distinct colors
  useEffect(() => {
    if (!xtermRef.current) return
    xtermRef.current.options.theme = {
      background: theme === 'dark' ? '#000000' : '#E2E8F0', // Distinct pure black in dark mode, soft gray in light mode
      foreground: theme === 'dark' ? '#F1F5F9' : '#0F172A',
      cursor: '#8B5CF6',
      selectionBackground: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    }
  }, [theme])

  return (
    <div className="h-full w-full overflow-hidden relative" style={{ backgroundColor: theme === 'dark' ? '#000000' : '#E2E8F0' }}>
      <style>{`
        .xterm-viewport::-webkit-scrollbar {
          width: 10px;
        }
        .xterm-viewport::-webkit-scrollbar-track {
          background: transparent;
        }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: var(--text-muted);
          border-radius: 5px;
          opacity: 0.4;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          opacity: 0.6;
        }
        .xterm-screen {
          padding-left: 16px;
          padding-top: 16px;
        }
      `}</style>
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  )
})

Terminal.displayName = 'Terminal'

export default Terminal
