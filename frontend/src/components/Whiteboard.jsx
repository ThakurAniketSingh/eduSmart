import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Pencil, Eraser, Minus, Square, Circle as CircleIcon, PaintBucket, Trash2, Download, Triangle } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

const TOOLS = [
  { id: 'pen', label: 'Pen', icon: Pencil },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'fill', label: 'Fill Bucket', icon: PaintBucket },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: CircleIcon },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
]

// The canvas will now ALWAYS have a white background so drawings look exactly identical for all users regardless of their UI theme.
const COLORS = ['#1E293B', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
const THICKNESS = [2, 4, 8]

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return [parseInt(h[0]+h[0], 16), parseInt(h[1]+h[1], 16), parseInt(h[2]+h[2], 16), 255]
  }
  const bigint = parseInt(h, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255]
}

function floodFill(ctx, x, y, fillColorHex) {
  const canvas = ctx.canvas
  const w = canvas.width
  const h = canvas.height
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  
  const startPos = (y * w + x) * 4
  const startR = data[startPos]
  const startG = data[startPos + 1]
  const startB = data[startPos + 2]
  const startA = data[startPos + 3]

  const fillRgba = hexToRgb(fillColorHex)

  if (startR === fillRgba[0] && startG === fillRgba[1] && startB === fillRgba[2] && startA === fillRgba[3]) {
    return
  }

  const matchStartColor = (pos) => {
    return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA
  }

  const colorPixel = (pos) => {
    data[pos] = fillRgba[0]
    data[pos + 1] = fillRgba[1]
    data[pos + 2] = fillRgba[2]
    data[pos + 3] = fillRgba[3]
  }

  const pixelStack = [[x, y]]

  while (pixelStack.length) {
    const newPos = pixelStack.pop()
    let currentX = newPos[0]
    let currentY = newPos[1]
    let pixelPos = (currentY * w + currentX) * 4

    while (currentY-- >= 0 && matchStartColor(pixelPos)) {
      pixelPos -= w * 4
    }
    pixelPos += w * 4
    currentY++

    let reachLeft = false
    let reachRight = false

    while (currentY++ < h - 1 && matchStartColor(pixelPos)) {
      colorPixel(pixelPos)

      if (currentX > 0) {
        if (matchStartColor(pixelPos - 4)) {
          if (!reachLeft) {
            pixelStack.push([currentX - 1, currentY])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (currentX < w - 1) {
        if (matchStartColor(pixelPos + 4)) {
          if (!reachRight) {
            pixelStack.push([currentX + 1, currentY])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }
      pixelPos += w * 4
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function applyEvent(ctx, event) {
  const { tool, x0, y0, x1, y1, color, width } = event
  
  if (tool === 'fill') {
    floodFill(ctx, Math.floor(x1), Math.floor(y1), color || '#3B82F6')
    return
  }

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
    ctx.lineWidth = (width || 4) * 4
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = color || '#3B82F6'
    ctx.fillStyle = color || '#3B82F6'
    ctx.lineWidth = width || 3
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (tool === 'pen' || tool === 'eraser') {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  } else if (tool === 'line') {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  } else if (tool === 'rect') {
    ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
  } else if (tool === 'circle') {
    const radius = Math.hypot(x1 - x0, y1 - y0)
    ctx.beginPath()
    ctx.arc(x0, y0, radius, 0, Math.PI * 2)
    ctx.stroke()
  } else if (tool === 'triangle') {
    ctx.beginPath()
    const minX = Math.min(x0, x1)
    const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1)
    const maxY = Math.max(y0, y1)
    
    // Draw an upward-pointing isosceles triangle fitting the bounding box
    ctx.moveTo((minX + maxX) / 2, minY)
    ctx.lineTo(minX, maxY)
    ctx.lineTo(maxX, maxY)
    ctx.closePath()
    ctx.stroke()
  }
}

const getCursorStyle = (toolId) => {
  // Always use dark stroke for cursors since canvas is now always light
  const strokeColor = '%230F172A'
  
  if (toolId === 'eraser') {
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/><path d="M6 11L13 18"/></svg>') 4 20, crosshair`
  }
  if (toolId === 'fill') {
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="M5 2l5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>') 2 22, crosshair`
  }
  if (toolId === 'pen') {
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>') 2 22, crosshair`
  }
  return 'crosshair'
}

const Whiteboard = forwardRef(function Whiteboard({ onDraw, onClear, readOnly }, ref) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const snapshotRef = useRef(null)
  const drawingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })
  const lastPointRef = useRef({ x: 0, y: 0 })
  const pendingEventsRef = useRef([])
  const canvasReadyRef = useRef(false)
  const { theme } = useTheme()

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0])
  const [thickness, setThickness] = useState(2)

  useImperativeHandle(ref, () => ({
    applyRemoteEvent: (event) => {
      if (!event) return
      if (!canvasReadyRef.current || !ctxRef.current) {
        pendingEventsRef.current.push(event)
        return
      }
      applyEvent(ctxRef.current, event)
    },
    applySnapshot: (events) => {
      if (!events || !events.length) return
      if (!canvasReadyRef.current || !ctxRef.current) {
        pendingEventsRef.current.push(...events)
        return
      }
      for (const evt of events) {
        applyEvent(ctxRef.current, evt)
      }
    },
    clearCanvas: () => {
      pendingEventsRef.current = []
      if (!ctxRef.current || !canvasRef.current) return
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctxRef.current = ctx

    const updateSize = () => {
      if (parent.clientWidth > 0 && parent.clientHeight > 0) {
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
          const tempCanvas = document.createElement('canvas')
          if (canvas.width > 0 && canvas.height > 0) {
            tempCanvas.width = canvas.width
            tempCanvas.height = canvas.height
            const tempCtx = tempCanvas.getContext('2d')
            tempCtx.drawImage(canvas, 0, 0)
          }

          canvas.width = parent.clientWidth
          canvas.height = parent.clientHeight

          if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0)
          }
        }

        if (!canvasReadyRef.current) {
          canvasReadyRef.current = true
        }

        if (pendingEventsRef.current.length > 0) {
          for (const evt of pendingEventsRef.current) {
            applyEvent(ctx, evt)
          }
          pendingEventsRef.current = []
        }
      }
    }

    // Measure immediately
    updateSize()

    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    
    resizeObserver.observe(parent)
    return () => resizeObserver.disconnect()
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / (rect.width || 1)
    const scaleY = canvas.height / (rect.height || 1)
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(e) {
    if (readOnly) return
    const pos = getPos(e)
    
    if (tool === 'fill') {
      const event = {
        tool: 'fill',
        x1: pos.x,
        y1: pos.y,
        color
      }
      applyEvent(ctxRef.current, event)
      onDraw(event)
      return
    }

    drawingRef.current = true
    startRef.current = pos
    lastPointRef.current = pos

    if (tool === 'pen' || tool === 'eraser') {
      // Draw starting dot immediately
      const dotEvent = {
        tool,
        x0: pos.x,
        y0: pos.y,
        x1: pos.x + 0.1,
        y1: pos.y + 0.1,
        color,
        width: thickness,
      }
      applyEvent(ctxRef.current, dotEvent)
      onDraw(dotEvent)
    } else if (tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'triangle') {
      snapshotRef.current = ctxRef.current.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      )
    }
  }

  function handlePointerMove(e) {
    if (readOnly || !drawingRef.current || tool === 'fill') return
    const pos = getPos(e)

    if (tool === 'pen' || tool === 'eraser') {
      const event = {
        tool,
        x0: lastPointRef.current.x,
        y0: lastPointRef.current.y,
        x1: pos.x,
        y1: pos.y,
        color,
        width: thickness,
      }
      applyEvent(ctxRef.current, event)
      onDraw(event)
      lastPointRef.current = pos
    } else if (tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'triangle') {
      ctxRef.current.putImageData(snapshotRef.current, 0, 0)
      applyEvent(ctxRef.current, {
        tool,
        x0: startRef.current.x,
        y0: startRef.current.y,
        x1: pos.x,
        y1: pos.y,
        color,
        width: thickness,
      })
    }
  }

  function handlePointerUp(e) {
    if (!drawingRef.current) return
    drawingRef.current = false
    const pos = getPos(e)

    if (tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'triangle') {
      const event = {
        tool,
        x0: startRef.current.x,
        y0: startRef.current.y,
        x1: pos.x,
        y1: pos.y,
        color,
        width: thickness,
      }
      onDraw(event)
    }
  }

  function handleClear() {
    const canvas = canvasRef.current
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  function handleDownload() {
    const canvas = canvasRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.fillStyle = '#ffffff' // canvas is forced white now
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.drawImage(canvas, 0, 0)
    
    const dataUrl = tempCanvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'whiteboard.png'
    a.click()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--header-bg)' }}>
        {!readOnly && TOOLS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            title={label}
            onClick={() => { setTool(id); }}
            className={`rounded-md p-2 transition-all ${
              tool === id
                ? 'bg-violet-500 text-white shadow-sm'
                : 'hover:bg-slate-300 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        
        {!readOnly && <div className="mx-2 h-5 w-px" style={{ backgroundColor: 'var(--border-color)' }} />}
        
        {!readOnly && (
          <div className="flex items-center gap-1" title="Thickness / Text Size">
          {THICKNESS.map(t => (
            <button
              key={t}
              onClick={() => setThickness(t)}
              className={`flex items-center justify-center h-7 w-7 rounded transition-all ${
                thickness === t ? 'bg-violet-500/10 ring-2 ring-violet-500' : 'hover:bg-slate-300 dark:hover:bg-white/5'
              }`}
            >
              <div 
                className="rounded-full bg-slate-600 dark:bg-slate-300"
                style={{ width: t * 1.5, height: t * 1.5 }}
              />
            </button>
          ))}
        </div>
        )}

        {!readOnly && <div className="mx-2 h-5 w-px" style={{ backgroundColor: 'var(--border-color)' }} />}
        
        {!readOnly && (
          <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`h-5 w-5 rounded-full border-2 transition-transform shadow-sm ${
                color === c ? 'scale-110' : 'border-transparent'
              }`}
              style={{ 
                backgroundColor: c,
                borderColor: color === c ? (theme === 'light' ? '#0F172A' : '#FFFFFF') : 'transparent'
              }}
            />
          ))}
          
          <label 
            className="flex items-center justify-center h-6 w-6 ml-1 cursor-pointer rounded-full border-2 border-dashed border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 overflow-hidden relative"
            title="Custom Color Picker"
          >
            <div className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)] opacity-30" />
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {readOnly && (
            <span className="text-xs font-semibold text-rose-500 mr-2 bg-rose-500/10 px-2 py-1 rounded">View Only</span>
          )}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-slate-300 dark:hover:bg-white/5 text-slate-500 transition-colors"
            title="Download Image"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {!readOnly && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
      <div 
        className="relative flex-1 min-h-0"
        style={{
          backgroundColor: '#FFFFFF'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: readOnly ? 'default' : getCursorStyle(tool) }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  )
})

export default Whiteboard
