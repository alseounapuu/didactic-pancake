'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'
import { localeTag } from '@/lib/i18n/format'

interface Source {
  // Publisher as it should be credited; never translated.
  name: string
  // i18n key of the one-line description of what the app takes from it.
  desc: string
  licence?: string
  url?: string
}

const GROUPS: { title: string; items: Source[] }[] = [
  {
    title: 'sources.timetablesTitle',
    items: [
      { name: 'Estonian national GTFS', desc: 'sources.gtfs', url: 'https://eu-gtfs.remix.com/estonia_unified_gtfs.zip' },
      { name: 'Elron', desc: 'sources.elronGtfs', url: 'https://elron.ee' },
      { name: 'TS Laevad', desc: 'sources.tslGtfs', url: 'https://www.praamid.ee' },
      { name: 'Fintraffic / digitraffic.fi', desc: 'sources.shipSailings', licence: 'CC 4.0 BY', url: 'https://www.digitraffic.fi/en/marine-traffic/' },
      { name: 'Operators', desc: 'sources.fares' },
    ],
  },
  {
    title: 'sources.liveTitle',
    items: [
      { name: 'Tallinn City Transport', desc: 'sources.tallinnLive', url: 'https://transport.tallinn.ee' },
      { name: 'Elron', desc: 'sources.elronLive', url: 'https://elron.ee' },
      { name: 'Fintraffic / digitraffic.fi', desc: 'sources.shipsLive', licence: 'CC 4.0 BY', url: 'https://www.digitraffic.fi/en/marine-traffic/' },
    ],
  },
  {
    title: 'sources.mapTitle',
    items: [
      { name: 'OpenStreetMap contributors', desc: 'sources.osm', licence: 'ODbL', url: 'https://www.openstreetmap.org/copyright' },
      { name: 'CARTO', desc: 'sources.carto', url: 'https://carto.com/attributions' },
      { name: 'Maa-amet', desc: 'sources.maaamet', url: 'https://inaadress.maaamet.ee' },
    ],
  },
  {
    title: 'sources.trafficTitle',
    items: [
      { name: 'Transpordiamet (Tark Tee)', desc: 'sources.tarktee', url: 'https://tarktee.mnt.ee' },
      { name: 'TomTom', desc: 'sources.tomtom', url: 'https://developer.tomtom.com/traffic-api' },
    ],
  },
]

// Credits for the live, timetable and map data shown in the app.
export function SourcesMenu({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const { t, locale } = useTranslation()
  // Date (with year) the information is being used, i.e. today.
  const usedOn = new Date().toLocaleDateString(localeTag(locale), { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <MenuDrawer title={t('menu.sources')} onClose={onClose} onBack={onBack}>
      <div className="p-4 flex flex-col gap-4 text-xs text-gray-700 dark:text-gray-200">
        <p className="text-gray-500 dark:text-gray-400">{t('sources.usedOn', { date: usedOn })}</p>
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t(group.title)}</h3>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item.desc}>
                  <span className="font-semibold">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </span>
                  {item.licence && <span className="text-gray-500 dark:text-gray-400"> · {item.licence}</span>}
                  <br />
                  {t(item.desc)}
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-gray-500 dark:text-gray-400">{t('sources.note')}</p>
      </div>
    </MenuDrawer>
  )
}
