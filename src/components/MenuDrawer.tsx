'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

interface MenuDrawerProps {
  title: string
  onClose: () => void
  children: ReactNode
}

// Left-half slide-in shell shared by the menu sections. The rest of the
// screen is a transparent backdrop so a tap anywhere on the map closes it.
export function MenuDrawer({ title, onClose, children }: MenuDrawerProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label={title}
        className="fixed inset-y-0 left-0 z-[56] w-1/2 min-w-[14rem] max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
          <span className="text-sm font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('menu.close')}
            className="p-1 rounded-full hover:bg-white/20 shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </nav>
    </>
  )
}
