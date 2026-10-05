'use client'

import { ChevronRight, Settings, Route, Database } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'

export type MenuSection = 'menu' | 'settings' | 'myRoutes' | 'sources'

interface MainMenuProps {
  onSelect: (section: MenuSection) => void
  onClose: () => void
}

// Top level of the hamburger drawer: pick Settings or My routes.
export function MainMenu({ onSelect, onClose }: MainMenuProps) {
  const { t } = useTranslation()
  const items = [
    { section: 'settings' as const, label: t('menu.settings'), icon: Settings },
    { section: 'myRoutes' as const, label: t('menu.myRoutes'), icon: Route },
    { section: 'sources' as const, label: t('menu.sources'), icon: Database },
  ]

  return (
    <MenuDrawer title={t('menu.open')} onClose={onClose}>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map(({ section, label, icon: Icon }) => (
          <li key={section}>
            <button
              type="button"
              onClick={() => onSelect(section)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </MenuDrawer>
  )
}
