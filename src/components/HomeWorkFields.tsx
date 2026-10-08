'use client'

import { useEffect, useRef, useState } from 'react'
import { Home, Briefcase, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'
import { useHomeWork } from '@/hooks/use-home-work'
import { LocationInput } from './LocationInput'

// Where the rider sets their Home and Work. Saved places then appear as the
// first options when searching from/to in the main search boxes. The box
// always shows the saved address and can be typed over directly to change it.
function Slot({ slot }: { slot: 'home' | 'work' }) {
  const { t } = useTranslation()
  const { places, setPlace, clearPlace } = useHomeWork()
  const saved = places[slot]
  const [text, setText] = useState(saved?.name ?? '')
  const Icon = slot === 'home' ? Home : Briefcase
  const label = t(`search.${slot}`)

  // Follow the stored value (picking a result, removing, or another tab).
  const savedName = saved?.name ?? ''
  const [prevSavedName, setPrevSavedName] = useState(savedName)
  if (prevSavedName !== savedName) {
    setPrevSavedName(savedName)
    setText(savedName)
  }
  const savedNameRef = useRef(savedName)
  useEffect(() => {
    savedNameRef.current = savedName
  }, [savedName])

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-200 mb-1">
        <Icon size={13} className="text-blue-600 dark:text-blue-400" />
        <span className="font-medium">{label}</span>
      </div>
      {/* Half-typed text that was never picked is not a change: once the box
          loses focus it goes back to the saved address. */}
      <div
        className="rounded-2xl border border-gray-200 dark:border-gray-700"
        onBlur={() => setTimeout(() => setText(savedNameRef.current), 250)}
      >
        <LocationInput
          label={label}
          placeholder={t('menu.homeWorkPlaceholder')}
          value={text}
          onChange={setText}
          onSelect={({ name, lat, lng }) => setPlace(slot, { name, lat, lng })}
          trailing={
            saved ? (
              <button
                type="button"
                onClick={() => clearPlace(slot)}
                aria-label={t('menu.removePlace', { label })}
                className="shrink-0 mr-2 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            ) : undefined
          }
        />
      </div>
    </div>
  )
}

export function HomeWorkFields() {
  const { t } = useTranslation()
  return (
    <>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('menu.homeWork')}</div>
      <Slot slot="home" />
      <Slot slot="work" />
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('menu.homeWorkHint')}</p>
    </>
  )
}
