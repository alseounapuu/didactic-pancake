'use client'

import { Menu } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

interface MenuButtonProps {
  onClick: () => void
}

export function MenuButton({ onClick }: MenuButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('menu.open')}
      title={t('menu.open')}
      className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center border-2 border-transparent backdrop-blur-xl bg-white/85 dark:bg-gray-900/80 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <Menu size={22} strokeWidth={2} className="text-gray-600 dark:text-gray-300" />
    </button>
  )
}
