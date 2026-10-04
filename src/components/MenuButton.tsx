'use client'

import { Menu } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

// Hamburger button in the search panel's top right; opens the menu drawer.
export function MenuButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('menu.open')}
      title={t('menu.open')}
      className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <Menu size={18} />
    </button>
  )
}
