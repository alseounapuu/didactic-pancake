'use client'

import { useRef } from 'react'

interface SheetHandleProps {
  heightVh?: number
  minVh: number
  maxVh: number
  onResize?: (deltaVh: number) => void
  // 'grow-up': dragging the handle up increases height — for a panel
  // anchored to the bottom of the viewport (its top edge floats), e.g.
  // RouteResults. 'grow-down': dragging the handle down increases height —
  // for a panel anchored to the top (its bottom edge floats), e.g. StopBoard.
  direction?: 'grow-up' | 'grow-down'
  label?: string
  className?: string
  // Keep the handle on desktop too (default: mobile only).
  showOnDesktop?: boolean
}

// Drag handle for resizing a floating panel on mobile — hidden from sm: up,
// where the panel floats as a regular card instead and dragging its edge
// wouldn't read as a sheet gesture (see RouteResults, the original source of
// this pattern).
export function SheetHandle({ heightVh, minVh, maxVh, onResize, direction = 'grow-up', label = 'Resize panel', className = '', showOnDesktop = false }: SheetHandleProps) {
  const dragStartY = useRef<number | null>(null)
  const sign = direction === 'grow-up' ? 1 : -1

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartY.current = e.clientY
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return
    const deltaVh = sign * ((dragStartY.current - e.clientY) / window.innerHeight) * 100
    dragStartY.current = e.clientY
    onResize?.(deltaVh)
  }
  const handlePointerUp = () => {
    dragStartY.current = null
  }

  return (
    <div
      className={`flex justify-center pt-3 pb-2 shrink-0 ${showOnDesktop ? '' : 'sm:hidden'} cursor-ns-resize touch-none select-none ${className}`}
      role="slider"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={minVh}
      aria-valuemax={maxVh}
      aria-valuenow={Math.round(heightVh ?? 0)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}
