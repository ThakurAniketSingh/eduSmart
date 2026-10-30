import { useState } from 'react'
import { FilePlus, Trash2, FileCode2, FileText, Loader2 } from 'lucide-react'
import Modal from './Modal.jsx'

export default function FileExplorer({ files, activeFileId, onSelect, onCreate, onDelete, creating, permissions }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [fileExt, setFileExt] = useState('java')
  const [pendingDelete, setPendingDelete] = useState(null)

  function handleCreate(e) {
    if (e && e.preventDefault) e.preventDefault()
    const name = newFileName.trim()
    if (!name) return
    onCreate(name + '.' + fileExt)
    setNewFileName('')
    setModalOpen(false)
  }

  function confirmDelete(file) {
    setPendingDelete(file)
  }

  function handleDelete() {
    if (!pendingDelete) return
    onDelete(pendingDelete.id)
    setPendingDelete(null)
  }

  function getFileIcon(fileName) {
    const ext = fileName?.split('.').pop().toLowerCase()
    if (ext === 'txt') return <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
    return <FileCode2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 h-[42px] items-center justify-between px-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Files
        </h2>
        {permissions?.canCreateFile !== false && (
          <button
            onClick={() => setModalOpen(true)}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-violet-500 transition-colors hover:bg-violet-500/10 disabled:opacity-40"
          >
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FilePlus className="h-3 w-3" />}
            New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {[...files].reverse().map((f) => (
          <div
            key={f.id}
            onClick={() => onSelect(String(f.id))}
            className={`group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
              String(f.id) === String(activeFileId)
                ? 'bg-violet-500/10 text-violet-400'
                : ''
            }`}
            style={String(f.id) !== String(activeFileId) ? { color: 'var(--text-secondary)' } : undefined}
            onMouseEnter={(e) => { if (String(f.id) !== String(activeFileId)) e.currentTarget.style.backgroundColor = 'var(--surface-secondary)' }}
            onMouseLeave={(e) => { if (String(f.id) !== String(activeFileId)) e.currentTarget.style.backgroundColor = '' }}
          >
            {getFileIcon(f.fileName)}
            <span className="flex-1 truncate text-sm">{f.fileName}</span>
            {permissions?.canDeleteFile !== false && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  confirmDelete(f)
                }}
                className="rounded p-1 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                aria-label={`Delete ${f.fileName}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create file modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New File"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newFileName.trim()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-md"
            >
              Create
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <label htmlFor="fileName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            File name
          </label>
          <div 
            className="flex flex-row items-center rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-violet-500/30"
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
            }}
          >
            <input
              id="fileName"
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. script, main"
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400"
              style={{ color: 'var(--text-primary)' }}
            />
            <div className="h-6 w-[1px] shrink-0" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <select
              value={fileExt}
              onChange={(e) => setFileExt(e.target.value)}
              className="bg-transparent px-2 py-2.5 text-sm outline-none cursor-pointer transition-colors shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <option value="java">Java (.java)</option>
              <option value="py">Python (.py)</option>
              <option value="js">JS (.js)</option>
              <option value="c">C (.c)</option>
              <option value="cpp">C++ (.cpp)</option>
              <option value="php">PHP (.php)</option>
              <option value="txt">Text (.txt)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete file?"
        footer={
          <>
            <button
              onClick={() => setPendingDelete(null)}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{pendingDelete?.fileName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
