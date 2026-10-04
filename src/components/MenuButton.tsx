'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, Settings, Route } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

export type MenuSection = 'settings' | 'myRoutes'

interface MenuButtonProps {
  onSelect: (section: MenuSection) => void
}

// Hamburger button sitting next to the language selector; opens a small
// dropdown with the two menu sections.
export function MenuButton({ onSelect }: MenuButtonProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setExpanded(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded])

  const items: { section: MenuSection; label: string; icon: typeof Settings }[] = [
    { section: 'settings', label: t('menu.settings'), icon: Settings },
    { section: 'myRoutes', label: t('menu.myRoutes'), icon: Route },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={t('menu.open')}
        title={t('menu.open')}
        className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Menu size={18} />
      </button>
      {expanded && (
        <div className="absolute top-12 right-0 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1 min-w-[10rem]">
          {items.map(({ section, label, icon: Icon }) => (
            <button
              key={section}
              type="button"
              onClick={() => {
                setExpanded(false)
                onSelect(section)
              }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
