'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'

const GROUPS: { title: string; items: string[] }[] = [
  { title: 'sources.liveTitle', items: ['sources.live1', 'sources.live2'] },
  { title: 'sources.scheduleTitle', items: ['sources.schedule1', 'sources.schedule2', 'sources.schedule3'] },
  { title: 'sources.mapTitle', items: ['sources.map1', 'sources.map2', 'sources.map3'] },
  { title: 'sources.trafficTitle', items: ['sources.traffic1', 'sources.traffic2'] },
  { title: 'sources.routingTitle', items: ['sources.routing1'] },
]

// Credits for the live, timetable and map data shown in the app.
export function SourcesMenu({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <MenuDrawer title={t('menu.sources')} onClose={onClose} onBack={onBack}>
      <div className="p-4 flex flex-col gap-4 text-xs text-gray-700 dark:text-gray-200">
        <p className="text-gray-500 dark:text-gray-400">{t('sources.intro')}</p>
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t(group.title)}</h3>
            <ul className="flex flex-col gap-1.5 list-disc pl-4">
              {group.items.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-gray-500 dark:text-gray-400">{t('sources.note')}</p>
      </div>
    </MenuDrawer>
  )
}
