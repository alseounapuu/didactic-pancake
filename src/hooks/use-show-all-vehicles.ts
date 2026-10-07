'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'showAllVehicles'
// Same "notify other instances in this tab" pattern as use-favorites.ts.
const CHANGE_EVENT = 'show-all-vehicles-changed'

function readStored(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

// Settings switch: on = every vehicle in the chosen areas, off = only the
// vehicle and route the rider searched for or tapped. Off by default.
export function useShowAllVehicles() {
  const [showAll, setShowAllState] = useState(readStored)

  useEffect(() => {
    const onChange = () => setShowAllState(readStored())
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setShowAll = useCallback((next: boolean) => {
    setShowAllState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { showAll, setShowAll }
}
