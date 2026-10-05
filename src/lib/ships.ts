import { ShipPosition } from '@/lib/types'

// Live ship positions (AIS) from Fintraffic's open Digitraffic Marine API
// (https://www.digitraffic.fi/en/marine-traffic/, licence CC 4.0 BY). Free,
// no key; requests should carry a Digitraffic-User header. Covers the Gulf of
// Finland and the waters around Estonia, so it includes Tallinn-Helsinki,
// Tallinn-Stockholm and the island ferries. It has no timetables — only where
// each ship is and where it says it is heading.
const BASE_URL = 'https://meri.digitraffic.fi/api/ais/v1'
const HEADERS = { Accept: 'application/json', 'Digitraffic-User': 'didactic-pancake' }
const FETCH_TIMEOUT_MS = 10_000

// Bounding box around Estonia and its coastal waters.
const BBOX = { minLat: 57.3, maxLat: 60.3, minLng: 21.3, maxLng: 28.7 }
// AIS ship types 60-69 are passenger ships (incl. ferries).
const PASSENGER_TYPE_MIN = 60
const PASSENGER_TYPE_MAX = 69
// Ships further north than this are only kept when their destination mentions
// Estonia — it keeps Finnish archipelago and Helsinki harbour ferries out.
const ESTONIA_LAT_MAX = 59.65
const ESTONIA_DESTINATION =
  /(?<![A-Z])EE[A-Z0-9]{3}(?![A-Z0-9])|TALLINN|MUUGA|PALDISKI|VIRTSU|KUIVASTU|HELTERMAA|ROHUK|K[ÄA]RDLA|SAAREMAA|HIIUMAA|P[ÄA]RNU|ESTONIA|EESTI/i
// Ignore positions that haven't been updated for this long.
const MAX_POSITION_AGE_MS = 30 * 60_000

export const LOCATIONS_CACHE_TTL = 30_000
export const VESSELS_CACHE_TTL = 15 * 60_000

// UN/LOCODEs ferries put in their AIS destination field.
const PORT_NAMES: Record<string, string> = {
  EEVAN: 'Tallinn',
  EETLL: 'Tallinn',
  EEMUG: 'Muuga',
  EEPAS: 'Paldiski',
  EEPLN: 'Paldiski',
  EEKUI: 'Kuivastu',
  EEVIR: 'Virtsu',
  EEHLT: 'Heltermaa',
  EERHK: 'Rohuküla',
  EEKDL: 'Kärdla',
  EEPRU: 'Pärnu',
  EESAA: 'Saaremaa',
  FIHEL: 'Helsinki',
  FIMHQ: 'Mariehamn',
  FITKU: 'Turku',
  SESTO: 'Stockholm',
  SEKPS: 'Kapellskär',
}

export function prettifyDestination(raw: string): string {
  return raw
    .replace(/[A-Z]{2}[A-Z0-9]{3}/g, (code) => PORT_NAMES[code] ?? code)
    .replace(/\s*(<->|<>|<=>|><|->|<-|>)\s*/g, ' ↔ ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface AisLocationFeature {
  mmsi: number
  geometry: { coordinates: [number, number] }
  properties: { sog: number; cog: number; heading: number; timestampExternal: number }
}
interface AisVessel {
  mmsi: number
  name: string
  destination?: string
  shipType: number
}

let locationsCache: { data: AisLocationFeature[]; timestamp: number } | null = null
let vesselsCache: { data: Map<number, AisVessel>; timestamp: number } | null = null

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE_URL + path, { headers: HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Digitraffic ${path} responded ${res.status}`)
  return res.json()
}

async function getLocations(now: number): Promise<AisLocationFeature[]> {
  if (locationsCache && now - locationsCache.timestamp < LOCATIONS_CACHE_TTL) return locationsCache.data
  const json = await getJson<{ features: AisLocationFeature[] }>('/locations')
  locationsCache = { data: json.features, timestamp: now }
  return json.features
}

async function getVessels(now: number): Promise<Map<number, AisVessel>> {
  if (vesselsCache && now - vesselsCache.timestamp < VESSELS_CACHE_TTL) return vesselsCache.data
  const list = await getJson<AisVessel[]>('/vessels')
  const map = new Map(
    list.filter((v) => v.shipType >= PASSENGER_TYPE_MIN && v.shipType <= PASSENGER_TYPE_MAX).map((v) => [v.mmsi, v]),
  )
  vesselsCache = { data: map, timestamp: now }
  return map
}

export async function fetchShips(now: number = Date.now()): Promise<ShipPosition[]> {
  const [locations, vessels] = await Promise.all([getLocations(now), getVessels(now)])
  const ships: ShipPosition[] = []
  for (const f of locations) {
    const vessel = vessels.get(f.mmsi)
    if (!vessel) continue
    const [lng, lat] = f.geometry.coordinates
    if (lat < BBOX.minLat || lat > BBOX.maxLat || lng < BBOX.minLng || lng > BBOX.maxLng) continue
    if (now - f.properties.timestampExternal > MAX_POSITION_AGE_MS) continue
    // 511 = "heading not available" in AIS; fall back to course over ground.
    const rawDestination = vessel.destination?.trim() || ''
    if (lat > ESTONIA_LAT_MAX && !ESTONIA_DESTINATION.test(rawDestination)) continue
    const heading = f.properties.heading >= 0 && f.properties.heading < 360 ? f.properties.heading : f.properties.cog
    ships.push({
      id: `ship-${f.mmsi}`,
      name: vessel.name?.trim() || String(f.mmsi),
      lat,
      lng,
      heading: Number.isFinite(heading) ? heading : 0,
      speedKnots: f.properties.sog,
      destination: prettifyDestination(rawDestination),
    })
  }
  return ships
}
