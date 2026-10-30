import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Files as FilesIcon, Code2 as EditorIcon, Users, MessageSquare, PenTool } from 'lucide-react'
import RoomHeader from '../components/RoomHeader.jsx'
import FileExplorer from '../components/FileExplorer.jsx'
import CodeEditor from '../components/CodeEditor.jsx'
import ParticipantsPanel from '../components/ParticipantsPanel.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import Whiteboard from '../components/Whiteboard.jsx'
import OutputPanel from '../components/OutputPanel.jsx'
import Modal from '../components/Modal.jsx'
import { roomApi, fileApi } from '../services/api.js'
import { RoomSocket } from '../websocket/socket.js'
import { playNotificationSound } from '../utils/audio.js'
import { useToast } from '../hooks/useToast.jsx'
import { SESSION_KEY, WS_EVENTS } from '../utils/constants.js'

const SIDE_TABS = ['Console', 'Whiteboard', 'Chat']
const CODE_UPDATE_DEBOUNCE_MS = 400

const FILE_TEMPLATES = {
  java: (fileName) => `public class ${fileName.split('.')[0] || 'Main'} {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  py: (fileName) => `# ${fileName}\nprint("Hello, World!")`,
  js: (fileName) => `// ${fileName}\nconsole.log("Hello, World!");`,
  c: (fileName) => `// ${fileName}\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: (fileName) => `// ${fileName}\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  php: (fileName) => `<?php\n// ${fileName}\necho "Hello, World!";\n?>`,
  txt: () => `This is a normal text file.\n`
}

function getTemplate(fileName) {
  if (!fileName) return '';
  const ext = fileName.split('.').pop().toLowerCase();
  const templateFn = FILE_TEMPLATES[ext];
  return templateFn ? templateFn(fileName) : '';
}

export default function ClassroomPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [session, setSession] = useState(null)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  const [files, setFiles] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const [editorKey, setEditorKey] = useState(0)
  const [creatingFile, setCreatingFile] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')

  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  const [isRunning, setIsRunning] = useState(false)

  const [activeSideTab, setActiveSideTab] = useState('Console')
  const [hasUnreadChat, setHasUnreadChat] = useState(false)
  const [mobileView, setMobileView] = useState('editor') // 'files' | 'editor' | 'whiteboard' | 'chat' | 'team'
  
  const [confirmAction, setConfirmAction] = useState(null) // 'leave' | 'delete' | null

  const socketRef = useRef(null)
  const whiteboardRef = useRef(null)
  const toastRef = useRef(toast)
  toastRef.current = toast
  const remoteApplyRef = useRef(null)
  const debounceRef = useRef(null)
  const saveDebounceRef = useRef(null)
  const terminalRef = useRef(null)
  const mainRef = useRef(null)
  const isDragging = useRef(false)
  const activeSideTabRef = useRef(activeSideTab)

  const [rightPanelWidth, setRightPanelWidth] = useState(50) // percentage
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35) // percentage for mobile console

  useEffect(() => {
    if (mobileView === 'editor') setActiveSideTab('Console')
    else if (mobileView === 'whiteboard') setActiveSideTab('Whiteboard')
    else if (mobileView === 'chat') setActiveSideTab('Chat')
  }, [mobileView])

  useEffect(() => {
    activeSideTabRef.current = activeSideTab
  }, [activeSideTab])

  // ---------------------------------------------------------------------
  // Bootstrap: validate session, load room, files, chat history
  // ---------------------------------------------------------------------
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      toastRef.current.error('Please join or create a classroom first.')
      navigate('/')
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed.roomCode !== roomCode) {
      toastRef.current.error('That session does not match this classroom.')
      navigate('/')
      return
    }
    setSession(parsed)
  }, [roomCode, navigate])

  useEffect(() => {
    if (!session) return

    let cancelled = false

    async function bootstrap() {
      try {
        const [roomData, fileList, messageList] = await Promise.all([
          roomApi.get(roomCode),
          fileApi.list(roomCode),
          roomApi.messages(roomCode),
        ])
        if (cancelled) return

        setRoom(roomData)
        setFiles(fileList)
        setMessages(messageList)

        // No file auto-opens — user picks from the list
      } catch (err) {
        toastRef.current.error(err.message)
        navigate('/')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, roomCode, navigate])

  // ---------------------------------------------------------------------
  // WebSocket connection
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!session) return

    const socket = new RoomSocket(roomCode, session.displayName, session.role)
    socketRef.current = socket

    const unsubStatus = socket.onStatusChange(setConnectionStatus)

    const unsubPresence = socket.on(WS_EVENTS.PRESENCE, (msg) => {
      const rawList = msg.payload?.participants || []
      // Deduplicate by displayName to guarantee no duplicate participant items
      const unique = []
      const seen = new Set()
      for (const p of rawList) {
        if (!seen.has(p.displayName)) {
          seen.add(p.displayName)
          unique.push(p)
        }
      }
      setParticipants(unique)
    })

    const unsubPermissions = socket.on('PERMISSIONS_UPDATED', (msg) => {
      if (!msg.payload) return;
      const updates = msg.payload;
      const { displayName } = updates;
      
      setParticipants((prev) => {
        const updated = prev.map((p) => 
          p.displayName === displayName 
            ? { ...p, ...updates } 
            : p
        )
        // Ensure no duplicates
        const unique = []
        const seen = new Set()
        for (const p of updated) {
          if (!seen.has(p.displayName)) {
            seen.add(p.displayName)
            unique.push(p)
          }
        }
        return unique
      });
      
      if (displayName === session.displayName) {
        toastRef.current.info('Your room permissions have been updated by the admin.');
      }
    })

    const unsubGlobalPermissions = socket.on('GLOBAL_PERMISSIONS_UPDATED', (msg) => {
      if (!msg.payload) return;
      const updates = msg.payload;
      
      setParticipants((prev) => {
        const updated = prev.map((p) => 
          p.role !== 'ADMIN' 
            ? { ...p, ...updates } 
            : p
        )
        const unique = []
        const seen = new Set()
        for (const p of updated) {
          if (!seen.has(p.displayName)) {
            seen.add(p.displayName)
            unique.push(p)
          }
        }
        return unique
      });
      
      if (session.role !== 'ADMIN') {
        toastRef.current.info('Global room permissions have been updated.');
      }
    })

    const unsubChat = socket.on(WS_EVENTS.CHAT, (msg) => {
      setMessages((prev) => [
        ...prev,
        { id: msg.payload?.id, sender: msg.sender, message: msg.payload?.message, timestamp: msg.payload?.timestamp, isDeleted: false },
      ])
      
      if (msg.sender !== session.displayName) {
        if (activeSideTabRef.current !== 'Chat') {
          setHasUnreadChat(true)
        }
        playNotificationSound()
      }
    })

    const unsubChatDelete = socket.on('CHAT_DELETE', (msg) => {
      setMessages((prev) => prev.map((m) => 
        String(m.id) === String(msg.payload?.id) 
          ? { ...m, isDeleted: true, deletedByRole: msg.payload?.deletedByRole } 
          : m
      ))
    })

    const unsubCode = socket.on(WS_EVENTS.CODE_UPDATE, (msg) => {
      const { fileId, content } = msg.payload || {}
      if (fileId == null) return

      setActiveFileId((currentActiveId) => {
        if (currentActiveId && String(fileId) === String(currentActiveId) && remoteApplyRef.current) {
          remoteApplyRef.current(content)
        }
        return currentActiveId
      })

      setFiles((prev) => prev.map((f) => (String(f.id) === String(fileId) ? { ...f, content } : f)))
    })

    const unsubDraw = socket.on(WS_EVENTS.WHITEBOARD_DRAW, (msg) => {
      whiteboardRef.current?.applyRemoteEvent(msg.payload)
    })

    const unsubClear = socket.on(WS_EVENTS.WHITEBOARD_CLEAR, () => {
      whiteboardRef.current?.clearCanvas()
    })

    const unsubWbSnapshot = socket.on('WHITEBOARD_SNAPSHOT', (msg) => {
      whiteboardRef.current?.applySnapshot(msg.payload?.events)
    })

    const unsubCodeOutput = socket.on(WS_EVENTS.CODE_RUN_OUTPUT, (msg) => {
      const { text } = msg.payload || {}
      if (text) {
        terminalRef.current?.write(text.replace(/\n/g, '\r\n'))
      }
    })

    const unsubCodeEnd = socket.on(WS_EVENTS.CODE_RUN_END, (msg) => {
      const { exitCode } = msg.payload || {}
      terminalRef.current?.write(`\r\n\x1b[38;5;242m[Process exited with code ${exitCode}]\x1b[0m\r\n`)
      setIsRunning(false)
    })

    // When another client creates/deletes a file, re-fetch the file list
    const unsubFileSync = socket.on(WS_EVENTS.FILE_SYNC, () => {
      fileApi.list(roomCode).then((fileList) => {
        setFiles(fileList)
      }).catch(() => {})
    })

    const unsubRoomDeleted = socket.on('ROOM_DELETED', () => {
      toastRef.current.error('The admin has deleted this room.')
      sessionStorage.removeItem(SESSION_KEY)
      navigate('/')
    })

    return () => {
      unsubStatus()
      unsubPresence()
      unsubPermissions()
      unsubGlobalPermissions()
      unsubChat()
      unsubChatDelete()
      unsubCode()
      unsubDraw()
      unsubClear()
      unsubWbSnapshot()
      unsubCodeOutput()
      unsubCodeEnd()
      unsubFileSync()
      unsubRoomDeleted()
      socket.close()
    }
  }, [session, roomCode, navigate])

  // ---------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------
  const activeFile = activeFileId ? (files.find((f) => String(f.id) === String(activeFileId)) || null) : null
  const isAdmin = session?.role === 'ADMIN'
  const myParticipantInfo = participants.find(p => p.displayName === session?.displayName)
  const myPermissions = {
    canDraw: isAdmin || (myParticipantInfo?.canDraw ?? false),
    canCreateFile: isAdmin || (myParticipantInfo?.canCreateFile ?? false),
    canEditFile: isAdmin || (myParticipantInfo?.canEditFile ?? false),
    canDeleteFile: isAdmin || (myParticipantInfo?.canDeleteFile ?? false),
  }

  // ---------------------------------------------------------------------
  // File actions
  // ---------------------------------------------------------------------
  // Save current file & reset console before switching away
  function switchAwayFromCurrentFile() {
    // Flush any pending debounce timers
    clearTimeout(debounceRef.current)
    clearTimeout(saveDebounceRef.current)

    // Auto-save the current file immediately
    if (activeFile) {
      fileApi.update(activeFile.id, { fileName: activeFile.fileName, content: activeFile.content }).catch(() => {})
    }

    // Clear console output
    terminalRef.current?.clear()
    setIsRunning(false)
    setSaveStatus('idle')
  }

  async function handleCreateFile(fileName) {
    setCreatingFile(true)
    try {
      const content = getTemplate(fileName)
      const created = await fileApi.create(roomCode, { fileName, content })
      
      switchAwayFromCurrentFile()
      
      // Add file to list but close editor — user picks from the list
      setFiles((prev) => [...prev, created])
      setActiveFileId(null)
      setEditorKey((k) => k + 1)
      setMobileView('files')
      
      toast.success(`${created.fileName} created.`)
      
      // Notify other clients to refresh their file list
      socketRef.current?.send(WS_EVENTS.FILE_SYNC, {})
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingFile(false)
    }
  }

  async function handleDeleteFile(fileId) {
    try {
      await fileApi.remove(fileId)
      setFiles((prev) => {
        const next = prev.filter((f) => String(f.id) !== String(fileId))
        if (String(activeFileId) === String(fileId)) {
          setActiveFileId(next[0]?.id ? String(next[0].id) : null)
        }
        return next
      })
      toast.success('File deleted.')
      
      // Notify other clients to refresh their file list
      socketRef.current?.send(WS_EVENTS.FILE_SYNC, {})
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleEditorChange(newContent) {
    if (!activeFile) return
    setFiles((prev) => prev.map((f) => (String(f.id) === String(activeFile.id) ? { ...f, content: newContent } : f)))
    setSaveStatus('saving')

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      socketRef.current?.send(WS_EVENTS.CODE_UPDATE, { fileId: activeFile.id, content: newContent })
    }, CODE_UPDATE_DEBOUNCE_MS)

    clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(() => {
      fileApi.update(activeFile.id, { fileName: activeFile.fileName, content: newContent })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('idle'))
    }, 1500)
  }

  async function handleSave(explicitContent) {
    if (!activeFile) return
    clearTimeout(saveDebounceRef.current)
    setSaveStatus('saving')
    try {
      const contentToSave = typeof explicitContent === 'string' ? explicitContent : activeFile.content
      await fileApi.update(activeFile.id, { fileName: activeFile.fileName, content: contentToSave })
      setSaveStatus('saved')
    } catch (err) {
      toast.error(err.message)
      setSaveStatus('idle')
    }
  }

  async function handleRun() {
    if (!activeFile) return
    setActiveSideTab('Console')

    setIsRunning(true)
    terminalRef.current?.clear()
    terminalRef.current?.write(`\x1b[38;5;242m$ Running ${activeFile.fileName}...\x1b[0m\r\n`)
    
    socketRef.current?.send(WS_EVENTS.CODE_RUN_START, {
      fileName: activeFile.fileName,
      content: activeFile.content
    })
  }

  function handleTerminalInput(data) {
    socketRef.current?.send(WS_EVENTS.CODE_RUN_INPUT, { input: data })
  }

  function handleStopRun() {
    socketRef.current?.send(WS_EVENTS.CODE_RUN_STOP, {})
    setIsRunning(false)
    terminalRef.current?.write('\r\n\x1b[38;5;242m[Process stopped]\x1b[0m\r\n')
  }

  function handleSideTabChange(tab) {
    setActiveSideTab(tab)
    if (tab === 'Chat') {
      setHasUnreadChat(false)
    }
    if (tab === 'Console') {
      setTimeout(() => terminalRef.current?.fit(), 0)
    }
  }

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    
    const handleMouseMove = (moveEvent) => {
      if (!isDragging.current || !mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      const leftPct = ((moveEvent.clientX - rect.left) / rect.width) * 100
      const newRightWidth = 100 - leftPct
      if (newRightWidth >= 30 && newRightWidth <= 70) {
        setRightPanelWidth(newRightWidth)
      }
    }
    
    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = 'default'
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      // Force terminal fit on resize end
      setTimeout(() => terminalRef.current?.fit(), 0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleVerticalPointerDown = useCallback((e) => {
    e.preventDefault()
    const isVerticalDragging = { current: true }
    document.body.style.cursor = 'row-resize'
    
    const handlePointerMove = (moveEvent) => {
      if (!isVerticalDragging.current || !mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
      const topPct = ((clientY - rect.top) / rect.height) * 100
      const newBottomHeight = 100 - topPct
      if (newBottomHeight >= 20 && newBottomHeight <= 80) {
        setBottomPanelHeight(newBottomHeight)
      }
    }
    
    const handlePointerUp = () => {
      isVerticalDragging.current = false
      document.body.style.cursor = 'default'
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
      setTimeout(() => {
        terminalRef.current?.fit()
        window.dispatchEvent(new Event('resize'))
      }, 0)
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handlePointerMove, { passive: false })
    window.addEventListener('touchend', handlePointerUp)
  }, [])

  // ---------------------------------------------------------------------
  // Whiteboard + chat actions
  // ---------------------------------------------------------------------
  const handleWhiteboardDraw = useCallback((event) => {
    socketRef.current?.send(WS_EVENTS.WHITEBOARD_DRAW, event)
  }, [])

  const handleWhiteboardClear = useCallback(() => {
    socketRef.current?.send(WS_EVENTS.WHITEBOARD_CLEAR, {})
  }, [])

  function handleSendChat(text) {
    socketRef.current?.send(WS_EVENTS.CHAT, { message: text })
  }

  function confirmLeave() {
    setConfirmAction('leave')
  }

  function confirmDeleteRoom() {
    setConfirmAction('delete')
  }

  function handleLeave() {
    socketRef.current?.close()
    sessionStorage.removeItem(SESSION_KEY)
    navigate('/')
  }

  async function handleDeleteRoom() {
    try {
      await roomApi.delete(roomCode)
      sessionStorage.removeItem(SESSION_KEY)
      toast.success("Classroom deleted successfully.")
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ---------------------------------------------------------------------

  if (loading || !room) {
    return (
      <div className="flex h-screen items-center justify-center text-sm transition-colors" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-muted)' }}>
        Loading classroom...
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col transition-colors" style={{ backgroundColor: 'var(--surface-primary)' }}>
      <RoomHeader
        roomName={room.roomName}
        roomCode={room.roomCode}
        participantCount={participants.length}
        connectionStatus={connectionStatus}
        onLeave={confirmLeave}
        isAdmin={session?.role === 'ADMIN'}
        onDelete={confirmDeleteRoom}
      />

      <style>{`
        @media (max-width: 1023px) {
          .mobile-split-bottom { 
            position: absolute !important; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            height: ${bottomPanelHeight}% !important; 
            z-index: 50 !important; 
            box-shadow: 0 -4px 10px rgba(0,0,0,0.2) !important;
          }
          .mobile-resizer {
            position: absolute !important;
            bottom: ${bottomPanelHeight}% !important;
            left: 0;
            right: 0;
            height: 6px;
            cursor: row-resize !important;
            z-index: 51 !important;
          }
        }
      `}</style>

      {/* Premium Mobile view switcher */}
      <div className="flex lg:hidden p-2 shadow-sm relative z-20" style={{ backgroundColor: 'var(--surface-primary)' }}>
        <div className="flex w-full rounded-xl p-1 gap-1" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          {[
            { id: 'files', label: 'Files', icon: FilesIcon },
            { id: 'editor', label: 'Editor', icon: EditorIcon },
            { id: 'whiteboard', label: 'Board', icon: PenTool },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'team', label: 'Team', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMobileView(id)}
              className={`flex flex-1 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                mobileView === id 
                  ? 'text-violet-600 dark:text-violet-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/10 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: mobileView === id ? 'var(--surface-card)' : 'transparent'
              }}
            >
              <Icon className="h-4 w-4" /> 
              <span>{label}</span>
              {id === 'chat' && hasUnreadChat && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 shadow-sm" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative lg:static">
        {/* Files panel */}
        <aside
          className={`absolute inset-0 z-10 lg:z-auto lg:static lg:w-64 shrink-0 ${mobileView === 'files' ? 'flex flex-col' : 'hidden'} lg:flex lg:flex-col`}
          style={{ borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}
        >
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelect={(id) => {
              if (String(id) === String(activeFileId)) return
              switchAwayFromCurrentFile()
              setActiveFileId(id)
              setMobileView('editor')
            }}
            onCreate={handleCreateFile}
            onDelete={handleDeleteFile}
            creating={creatingFile}
            roomCode={roomCode}
            permissions={myPermissions}
          />
        </aside>

        {/* Center: editor + side tabs */}
        <main 
          ref={mainRef}
          style={{ '--right-panel-width': `${rightPanelWidth}%`, '--left-panel-width': `${100 - rightPanelWidth}%` }}
          className={`absolute inset-0 z-10 lg:z-auto lg:static lg:flex lg:flex-1 lg:min-w-0 flex-col lg:flex-row ${
            (mobileView === 'editor' || mobileView === 'whiteboard' || mobileView === 'chat') ? 'flex' : 'hidden'
          }`}
        >
          <div className={`flex-col flex-1 lg:flex-none min-h-0 lg:w-[var(--left-panel-width)] shadow-sm z-10 lg:z-auto shrink-0 lg:shrink ${
            (mobileView === 'whiteboard' || mobileView === 'chat') ? 'hidden lg:flex' : 'flex'
          }`}>
            <CodeEditor
              key={`${String(activeFile?.id || 'empty')}-${editorKey}`}
              fileId={activeFile?.id}
              fileName={activeFile?.fileName}
              content={activeFile?.content || ''}
              onChange={handleEditorChange}
              onSave={handleSave}
              onRun={handleRun}
              saveStatus={saveStatus}
              isRunning={isRunning}
              remoteApplyRef={remoteApplyRef}
              readOnly={!myPermissions.canEditFile}
              onClose={() => {
                switchAwayFromCurrentFile()
                setActiveFileId(null)
                setEditorKey((k) => k + 1)
              }}
            />
          </div>

          {/* Desktop Resizer */}
          <div 
            className="hidden lg:flex flex-col items-center justify-center w-1.5 bg-slate-400 dark:bg-slate-700 hover:bg-violet-400 dark:hover:bg-violet-500 cursor-col-resize shrink-0 z-20 transition-all group shadow-sm border-x border-slate-200 dark:border-slate-800"
            onMouseDown={handleMouseDown}
          >
            {/* Grip dots */}
            <div className="flex flex-col gap-[3px] opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
            </div>
          </div>
          
          {/* Mobile Vertical Resizer */}
          <div 
            className={`lg:hidden flex items-center justify-center h-2 bg-slate-400 dark:bg-slate-700 hover:bg-violet-400 dark:hover:bg-violet-500 transition-all mobile-resizer group shadow-sm border-y border-slate-200 dark:border-slate-800 ${mobileView === 'editor' ? 'flex' : 'hidden'}`}
            onTouchStart={handleVerticalPointerDown}
            onMouseDown={handleVerticalPointerDown}
          >
            {/* Horizontal Grip dots */}
            <div className="flex gap-[3px] opacity-40 group-hover:opacity-100 transition-opacity">
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              <div className="w-[3px] h-[3px] bg-slate-600 dark:bg-slate-300 rounded-full"></div>
            </div>
          </div>

          <div 
            className={`flex-col flex-1 lg:flex-none min-h-0 lg:w-[var(--right-panel-width)] shrink-0 lg:shrink border-t border-[var(--border-color)] lg:border-t-0 ${
              mobileView === 'editor' ? 'flex mobile-split-bottom' : 'flex'
            }`}
            style={{ 
              backgroundColor: 'var(--surface-primary)',
              marginTop: '0' // Override tailwind
            }}
          >
            <div className="hidden lg:flex w-full shrink-0 items-center justify-center px-2 h-[42px] border-b border-[var(--border-color)]" style={{ backgroundColor: 'var(--surface-secondary)' }}>
              <div className="flex w-full bg-slate-200/60 dark:bg-slate-800/60 p-0.5 rounded-lg shadow-inner gap-0.5">
                {SIDE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleSideTabChange(tab)}
                    className={`relative flex-1 h-[28px] flex items-center justify-center text-xs font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${
                      activeSideTab === tab
                        ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {tab === 'Console' ? 'Console' : tab}
                    {tab === 'Chat' && hasUnreadChat && (
                      <span className="absolute top-1.5 right-[15%] h-2 w-2 rounded-full bg-rose-500 shadow-sm animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-white dark:bg-transparent transition-colors">
              <div className={activeSideTab === 'Chat' ? 'h-full' : 'hidden'}>
                <ChatPanel 
                  messages={messages} 
                  onSend={handleSendChat} 
                  onDeleteMessage={(id) => socketRef.current?.send('CHAT_DELETE', { id })}
                  currentUser={session?.displayName}
                  participants={participants} 
                />
              </div>
              <div className={activeSideTab === 'Whiteboard' ? 'h-full' : 'hidden'}>
                <Whiteboard
                  ref={whiteboardRef}
                  onDraw={handleWhiteboardDraw}
                  onClear={handleWhiteboardClear}
                  readOnly={!myPermissions.canDraw}
                />
              </div>
              <div className={activeSideTab === 'Console' ? 'h-full' : 'hidden'}>
                <OutputPanel
                  terminalRef={terminalRef}
                  onTerminalInput={handleTerminalInput}
                  isRunning={isRunning}
                  onStop={handleStopRun}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Participants panel */}
        <aside
          className={`absolute inset-0 z-10 lg:z-auto lg:static lg:w-64 shrink-0 ${mobileView === 'team' ? 'flex flex-col' : 'hidden'} lg:flex lg:flex-col`}
          style={{ borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--sidebar-bg)' }}
        >
          <ParticipantsPanel 
            participants={participants} 
            currentUser={session?.displayName} 
            isAdmin={isAdmin}
            roomCode={roomCode}
          />
        </aside>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'delete' ? 'Delete classroom?' : 'Leave classroom?'}
        footer={
          <>
            <button
              onClick={() => setConfirmAction(null)}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmAction === 'delete') handleDeleteRoom()
                else if (confirmAction === 'leave') handleLeave()
                setConfirmAction(null)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                confirmAction === 'delete' ? 'bg-rose-500 hover:bg-rose-400' : 'bg-amber-500 hover:bg-amber-400'
              }`}
            >
              {confirmAction === 'delete' ? 'Delete' : 'Leave'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {confirmAction === 'delete' ? (
            <>Are you sure you want to completely delete the classroom <strong style={{ color: 'var(--text-primary)' }}>{room.roomName}</strong>? This action cannot be undone and will permanently remove all files, chats, and participants.</>
          ) : (
            <>Are you sure you want to leave the classroom <strong style={{ color: 'var(--text-primary)' }}>{room.roomName}</strong>?</>
          )}
        </p>
      </Modal>
    </div>
  )
}
