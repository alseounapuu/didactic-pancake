'use client'

import { X, Star } from 'lucide-react'
import { FavoriteRoute } from '@/lib/types'
import { useFavorites } from '@/hooks/use-favorites'
import { useTranslation } from '@/lib/i18n/context'

interface MyRoutesMenuProps {
  onSelect: (favorite: FavoriteRoute) => void
  onClose: () => void
}

// Left-half slide-in menu listing the rider's saved routes. The rest of the
// screen is a transparent backdrop so a tap anywhere on the map closes it.
export function MyRoutesMenu({ onSelect, onClose }: MyRoutesMenuProps) {
  const { t } = useTranslation()
  const { favorites, removeFavorite } = useFavorites()

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} aria-hidden="true" />
      <nav
        aria-label={t('menu.myRoutes')}
        className="fixed inset-y-0 left-0 z-[56] w-1/2 min-w-[14rem] max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
          <span className="text-sm font-semibold">{t('menu.myRoutes')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('menu.close')}
            className="p-1 rounded-full hover:bg-white/20 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('menu.empty')}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {favorites.map((favorite) => (
                <li key={favorite.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelect(favorite)}
                    className="flex-1 min-w-0 flex items-start gap-2 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Star size={14} fill="#F59E0B" stroke="#F59E0B" className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate">{favorite.fromName}</span>
                      <span className="block truncate text-gray-500 dark:text-gray-400">&darr; {favorite.toName}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFavorite(favorite.id)}
                    aria-label={t('favorite.removeAria', { from: favorite.fromName, to: favorite.toName })}
                    className="p-2 mr-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </>
  )
}
