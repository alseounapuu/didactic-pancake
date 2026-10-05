'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'showShips'
// Same "notify other instances in this tab" pattern as use-favorites.ts.
const CHANGE_EVENT = 'show-ships-changed'

function readStored(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

// Settings switch: show passenger ships and ferries on the map. On by default.
export function useShowShips() {
  const [showShips, setShowShipsState] = useState(readStored)

  useEffect(() => {
    const onChange = () => setShowShipsState(readStored())
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setShowShips = useCallback((next: boolean) => {
    setShowShipsState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { showShips, setShowShips }
}
