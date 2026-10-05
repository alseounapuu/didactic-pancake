import { foldName, tokenize, scoreName } from '@/lib/stop-search'
import { distanceMeters } from '@/lib/delay'

type Lang = 'en' | 'et' | 'ru'

export interface ForeignFerryPort {
  // UN/LOCODE of the port in Digitraffic's port-call data, when it has sailing
  // times (Finnish ports only) — see ferry-sailings.ts. Absent: no timetable.
  locode?: string
  // The Estonian harbour the ferries from/to this port use.
  estonianPort: { name: string; lat: number; lng: number }
  names: Record<Lang, string>
  // Other spellings people search by (local-language names).
  aliases: string[]
  country: Record<Lang, string>
  // Estonian ports with a regular passenger ferry to this port.
  from: Record<Lang, string[]>
  lat: number
  lng: number
}

const TALLINN = { en: 'Tallinn', et: 'Tallinn', ru: 'Таллин' }
const TALLINN_HARBOUR = { name: 'Tallinn Old City Harbour', lat: 59.4467, lng: 24.765 }
const PALDISKI_HARBOUR = { name: 'Paldiski South Harbour', lat: 59.3365, lng: 24.056 }
const PALDISKI = { en: 'Paldiski', et: 'Paldiski', ru: 'Палдиски' }
const FINLAND = { en: 'Finland', et: 'Soome', ru: 'Финляндия' }
const SWEDEN = { en: 'Sweden', et: 'Rootsi', ru: 'Швеция' }

// Ports outside Estonia that passenger ferries sail to from Estonia
// (Tallink, Viking Line, Eckerö Line, DFDS). Positions match the ones used for
// ship routes in src/lib/ships.ts.
const FOREIGN_FERRY_PORTS: ForeignFerryPort[] = [
  {
    names: { en: 'Helsinki', et: 'Helsingi', ru: 'Хельсинки' },
    aliases: ['Helsinki', 'Helsingfors'],
    locode: 'FIHEL',
    estonianPort: TALLINN_HARBOUR,
    country: FINLAND,
    from: { en: [TALLINN.en], et: [TALLINN.et], ru: [TALLINN.ru] },
    lat: 60.167,
    lng: 24.956,
  },
  {
    names: { en: 'Stockholm', et: 'Stockholm', ru: 'Стокгольм' },
    aliases: ['Stockholm', 'Stokholm'],
    estonianPort: TALLINN_HARBOUR,
    country: SWEDEN,
    from: { en: [TALLINN.en], et: [TALLINN.et], ru: [TALLINN.ru] },
    lat: 59.35,
    lng: 18.109,
  },
  {
    names: { en: 'Mariehamn (Åland)', et: 'Maarianhamina (Ahvenamaa)', ru: 'Мариехамн (Аланды)' },
    aliases: ['Mariehamn', 'Maarianhamina', 'Åland', 'Aland', 'Ahvenamaa'],
    estonianPort: TALLINN_HARBOUR,
    country: FINLAND,
    from: { en: [TALLINN.en], et: [TALLINN.et], ru: [TALLINN.ru] },
    lat: 60.1,
    lng: 19.933,
  },
  {
    names: { en: 'Kapellskär', et: 'Kapellskär', ru: 'Капельшер' },
    aliases: ['Kapellskar', 'Kapellskär', 'Norrtälje', 'Norrtalje'],
    estonianPort: PALDISKI_HARBOUR,
    country: SWEDEN,
    from: { en: [PALDISKI.en], et: [PALDISKI.et], ru: [PALDISKI.ru] },
    lat: 59.72,
    lng: 19.068,
  },
]

// A trip endpoint within this distance of a foreign port counts as "at" that port.
const NEAR_PORT_M = 6000

export function findForeignPortNear(lat: number, lng: number): ForeignFerryPort | null {
  let best: ForeignFerryPort | null = null
  let bestDist = NEAR_PORT_M
  for (const port of FOREIGN_FERRY_PORTS) {
    const dist = distanceMeters(lat, lng, port.lat, port.lng)
    if (dist <= bestDist) {
      best = port
      bestDist = dist
    }
  }
  return best
}

const PORT_LABEL: Record<Lang, string> = { en: 'Ferry port', et: 'Sadam', ru: 'Паромный порт' }
const FROM_LABEL: Record<Lang, string> = { en: 'ferry from', et: 'praam sadamast', ru: 'паром из' }

export interface ForeignFerryPortResult {
  name: string
  lat: number
  lng: number
  placeDetail: string
  score: number
}

export function searchForeignFerryPorts(query: string, lang: Lang): ForeignFerryPortResult[] {
  const foldedQuery = foldName(query)
  const tokens = tokenize(query)
  const results: ForeignFerryPortResult[] = []
  for (const port of FOREIGN_FERRY_PORTS) {
    const candidates = [...Object.values(port.names), ...port.aliases, ...Object.values(port.country)]
    const score = Math.max(...candidates.map((c) => scoreName(foldName(c), foldedQuery, tokens)))
    if (score <= 0) continue
    results.push({
      name: port.names[lang],
      lat: port.lat,
      lng: port.lng,
      placeDetail: `${PORT_LABEL[lang]} · ${port.country[lang]} · ${FROM_LABEL[lang]} ${port.from[lang].join(', ')}`,
      score,
    })
  }
  return results
}
