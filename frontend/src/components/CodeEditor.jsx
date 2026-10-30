import { useEffect, useRef, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { Loader2, Play, Check, Download, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

export default function CodeEditor({
  fileId,
  fileName,
  content,
  onChange,
  onSave,
  saveStatus,
  onRun,
  isRunning,
  remoteApplyRef,
  onClose,
  readOnly,
}) {
  const editorRef = useRef(null)
  const suppressNextChange = useRef(false)
  const [localContent, setLocalContent] = useState(content)
  const { theme } = useTheme()
  const monaco = useMonaco()
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#F8F9FA',
        }
      })
    }
  }, [monaco])

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (remoteApplyRef) {
      remoteApplyRef.current = (newContent) => {
        const editor = editorRef.current
        if (!editor) return
        const current = editor.getValue()
        if (current === newContent) return
        suppressNextChange.current = true
        const position = editor.getPosition()
        editor.setValue(newContent)
        if (position) editor.setPosition(position)
      }
    }
  }, [remoteApplyRef])

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveRef.current) {
        onSaveRef.current(editor.getValue())
      }
    })
  }

  function handleEditorChange(value) {
    setLocalContent(value)
    if (suppressNextChange.current) {
      suppressNextChange.current = false
      return
    }
    onChange(value)
  }

  function handleDownload() {
    if (!fileName || !localContent) return
    const blob = new Blob([localContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  function getLanguageFromFileName(name) {
    if (!name) return 'plaintext'
    const ext = name.split('.').pop().toLowerCase()
    const map = {
      java: 'java',
      py: 'python',
      js: 'javascript',
      c: 'c',
      cpp: 'cpp',
      php: 'php',
      txt: 'plaintext',
    }
    return map[ext] || 'plaintext'
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 h-[42px] items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <span className="font-mono text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {fileName || 'No file selected'}
          </span>
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={!fileId || !localContent}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/10 dark:hover:bg-white/5 disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
            title="Download File"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            disabled={!fileId}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
            title="Close File"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
          <button
            onClick={onRun}
            disabled={isRunning || !fileId}
            className="inline-flex items-center gap-1.5 rounded-md bg-signal-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-signal-600 disabled:opacity-50 transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Running</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="hidden sm:inline">Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative" style={{ backgroundColor: 'var(--code-bg)' }}>
        {!fileId ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a file to start coding</p>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getLanguageFromFileName(fileName)}
            theme={theme === 'dark' ? 'vs-dark' : 'custom-light'}
            value={localContent}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              wordWrap: 'on',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              readOnly: readOnly,
            }}
            loading={<div className="flex h-full items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading editor...</div>}
          />
        )}
      </div>
    </div>
  )
}

function SaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="h-3 w-3 animate-spin" /> Saving
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-signal-500">
        <Check className="h-3 w-3" /> Saved
      </span>
    )
  }
  return null
}
