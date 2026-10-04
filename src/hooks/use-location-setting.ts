'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'locationEnabled'
// Same "notify other instances in this tab" pattern as use-favorites.ts.
const CHANGE_EVENT = 'location-setting-changed'

// In-app switch (Settings): when off, the app never asks the browser for the
// rider's position. On by default.
export function isLocationEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function useLocationSetting() {
  const [enabled, setEnabledState] = useState(isLocationEnabled)

  useEffect(() => {
    const onChange = () => setEnabledState(isLocationEnabled())
    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { enabled, setEnabled }
}
