import { ShipPosition, TripStopInfo, VehiclePosition } from '@/lib/types'
import { distanceMeters } from '@/lib/delay'
import { calcHeading } from '@/lib/shape-geometry'
import { encodePolyline } from '@/lib/encode-polyline'

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
      id: `ship:${f.mmsi}`,
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

// A ship shown like any other vehicle on the map: mode 'ferry', its name as
// the "line". The ':' in the id marks it as a known trip, so the timetable
// panel asks /api/trip-stops for it by id (handled by buildShipTrip below).
export function shipToVehicle(ship: ShipPosition): VehiclePosition {
  return {
    id: ship.id,
    mode: 'ferry',
    line: ship.name,
    lat: ship.lat,
    lng: ship.lng,
    heading: ship.heading,
    destination: ship.destination,
  }
}

interface Port {
  name: string
  lat: number
  lng: number
}

// Ports ships name in their AIS destination, by UN/LOCODE and by plain name
// (matched without diacritics, upper case). Approximate harbour positions.
const TALLINN: Port = { name: 'Tallinn', lat: 59.444, lng: 24.768 }
const PALDISKI: Port = { name: 'Paldiski', lat: 59.336, lng: 24.054 }
const HELSINKI: Port = { name: 'Helsinki', lat: 60.167, lng: 24.956 }
const STOCKHOLM: Port = { name: 'Stockholm', lat: 59.35, lng: 18.109 }
const KAPELLSKAR: Port = { name: 'Kapellskär', lat: 59.72, lng: 19.068 }
const MARIEHAMN: Port = { name: 'Mariehamn', lat: 60.1, lng: 19.933 }
const MUUGA: Port = { name: 'Muuga', lat: 59.5, lng: 24.965 }
const VIRTSU: Port = { name: 'Virtsu', lat: 58.574, lng: 23.511 }
const KUIVASTU: Port = { name: 'Kuivastu', lat: 58.577, lng: 23.396 }
const HELTERMAA: Port = { name: 'Heltermaa', lat: 58.868, lng: 23.062 }
const ROHUKULA: Port = { name: 'Rohuküla', lat: 58.917, lng: 23.435 }
const TURKU: Port = { name: 'Turku', lat: 60.435, lng: 22.21 }
const SVIBY: Port = { name: 'Sviby', lat: 58.971, lng: 23.313 }
const LEPPNEEME: Port = { name: 'Leppneeme', lat: 59.551, lng: 24.867 }
const KELNASE: Port = { name: 'Kelnase', lat: 59.6375, lng: 25.0116 }
const PORTS: Record<string, Port> = {
  EEVAN: TALLINN,
  EETLL: TALLINN,
  TALLINN: TALLINN,
  EEPAS: PALDISKI,
  EEPLN: PALDISKI,
  PALDISKI: PALDISKI,
  FIHEL: HELSINKI,
  HELSINKI: HELSINKI,
  SESTO: STOCKHOLM,
  STOCKHOLM: STOCKHOLM,
  SEKPS: KAPELLSKAR,
  KAPELLSKAR: KAPELLSKAR,
  FIMHQ: MARIEHAMN,
  MARIEHAMN: MARIEHAMN,
  EEMUG: MUUGA,
  MUUGA: MUUGA,
  EEVIR: VIRTSU,
  VIRTSU: VIRTSU,
  EEKUI: KUIVASTU,
  KUIVASTU: KUIVASTU,
  EEHLT: HELTERMAA,
  HELTERMAA: HELTERMAA,
  EERHK: ROHUKULA,
  ROHUKULA: ROHUKULA,
  // AIS destinations are typed by hand, often without diacritics (Ü -> Y).
  ROHUKYLA: ROHUKULA,
  SVIBY: SVIBY,
  LEPPNEEME: LEPPNEEME,
  KELNASE: KELNASE,
  FITKU: TURKU,
  TURKU: TURKU,
}

function foldPortToken(token: string): string {
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

// A port name, tolerating trailing junk crews add ("HELTERMAA L").
function lookupPort(token: string): Port | undefined {
  const words = foldPortToken(token).split(/\s+/)
  for (let n = words.length; n > 0; n--) {
    const port = PORTS[words.slice(0, n).join(' ')]
    if (port) return port
  }
  return undefined
}

// "EEVAN<>FIHEL", "VIRTSU < > KUIVASTU", "Tallinn-Helsinki",
// "ROHUKYLA=HELTERMAA L" -> ports in order.
function portsFromDestination(destination: string): Port[] {
  const ports: Port[] = []
  for (const token of destination.split(/\s*[<>=\-↔]+\s*/)) {
    const port = lookupPort(token)
    if (port && ports[ports.length - 1] !== port) ports.push(port)
  }
  return ports
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return calcHeading(lat1, lng1, lat2, lng2)
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const KNOT_MS = 0.514444
const NEAR_PORT_M = 1500
// Below this speed an arrival time would be meaningless (ship at anchor / in port).
const MIN_ETA_SPEED_KN = 3

// The "trip" of a ship in /api/trip-stops' response shape, so the map's route
// line + stop dots and the timetable panel work for ships exactly like for a
// bus: the ports named in its AIS destination, joined by straight lines
// (approximate — AIS carries no route), with arrival times estimated from
// distance and current speed.
export function buildShipTrip(ship: ShipPosition, nowSec: number) {
  let ports = portsFromDestination(ship.destination)
  if (ports.length === 0) return null
  // Which way along the named ports is the ship going?
  if (ports.length >= 2) {
    const first = ports[0]
    const last = ports[ports.length - 1]
    if (angleDiff(ship.heading, bearing(first.lat, first.lng, last.lat, last.lng)) > 90) ports = [...ports].reverse()
  }
  const canEstimate = ship.speedKnots >= MIN_ETA_SPEED_KN
  const stops: TripStopInfo[] = ports.map((port) => {
    const dist = distanceMeters(ship.lat, ship.lng, port.lat, port.lng)
    const ahead = angleDiff(ship.heading, bearing(ship.lat, ship.lng, port.lat, port.lng)) <= 90
    const status: TripStopInfo['status'] = dist <= NEAR_PORT_M ? 'current' : ahead ? 'upcoming' : 'passed'
    const offsetSec = canEstimate ? dist / (ship.speedKnots * KNOT_MS) : 0
    const time = Math.max(0, Math.round(status === 'passed' ? nowSec - offsetSec : nowSec + offsetSec))
    return {
      name: port.name,
      lat: port.lat,
      lng: port.lng,
      stopId: 'port:' + port.name,
      scheduledArrival: time,
      scheduledDeparture: time,
      status,
      ...(canEstimate && status === 'upcoming' ? {} : { noTime: true }),
    }
  })
  const line: [number, number][] = ports.map((p) => [p.lng, p.lat])
  // A single named port has no line of its own — draw from the ship to it.
  if (line.length === 1) line.unshift([ship.lng, ship.lat])
  return {
    tripId: ship.id,
    line: ship.name,
    mode: 'FERRY',
    stops,
    currentTimeSeconds: nowSec,
    geometry: encodePolyline(line),
  }
}

export async function findShip(id: string): Promise<ShipPosition | null> {
  return (await fetchShips()).find((s) => s.id === id) ?? null
}
