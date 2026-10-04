'use client'

import { ReactNode } from 'react'
import { X, Star, History } from 'lucide-react'
import { FavoriteRoute } from '@/lib/types'
import { useFavorites } from '@/hooks/use-favorites'
import { useRecentSearches } from '@/hooks/use-recent-searches'
import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'

interface MyRoutesMenuProps {
  onSelect: (trip: FavoriteRoute) => void
  onClose: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
      {children}
    </section>
  )
}

// "My routes": saved favorites plus the auto-logged search history (the same
// trips shown as chips under the search bar).
export function MyRoutesMenu({ onSelect, onClose }: MyRoutesMenuProps) {
  const { t } = useTranslation()
  const { favorites, removeFavorite } = useFavorites()
  const { recents, removeRecent } = useRecentSearches()

  const renderRow = (trip: FavoriteRoute, icon: ReactNode, onRemove: () => void) => (
    <li key={trip.id} className="flex items-center">
      <button
        type="button"
        onClick={() => onSelect(trip)}
        className="flex-1 min-w-0 flex items-start gap-2 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate">{trip.fromName}</span>
          <span className="block truncate text-gray-500 dark:text-gray-400">&darr; {trip.toName}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('favorite.removeAria', { from: trip.fromName, to: trip.toName })}
        className="p-2 mr-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
      >
        <X size={14} />
      </button>
    </li>
  )

  const empty = (text: string) => <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
  const listClass = 'divide-y divide-gray-100 dark:divide-gray-700'

  return (
    <MenuDrawer title={t('menu.myRoutes')} onClose={onClose}>
      <Section title={t('menu.favorites')}>
        {favorites.length === 0 ? (
          empty(t('menu.empty'))
        ) : (
          <ul className={listClass}>
            {favorites.map((f) =>
              renderRow(f, <Star size={14} fill="#F59E0B" stroke="#F59E0B" />, () => removeFavorite(f.id)),
            )}
          </ul>
        )}
      </Section>
      <Section title={t('menu.history')}>
        {recents.length === 0 ? (
          empty(t('menu.emptyHistory'))
        ) : (
          <ul className={listClass}>
            {recents.map((r) =>
              renderRow(r, <History size={14} className="text-gray-400 dark:text-gray-500" />, () => removeRecent(r.id)),
            )}
          </ul>
        )}
      </Section>
    </MenuDrawer>
  )
}
