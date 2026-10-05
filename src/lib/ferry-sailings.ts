// Ferry sailings between Estonia and Finland, built from Fintraffic's open
// Digitraffic port-call data (https://www.digitraffic.fi/en/marine-traffic/,
// licence CC 4.0 BY): for every call a ship makes at a Finnish port it lists the
// arrival and departure time (actual if already happened, else the agent's
// estimate) and the previous/next port. That gives the Finnish-end times of
// each Tallinn <-> Helsinki sailing; the Estonian-end time is estimated from the
// ship's usual crossing time, since the Finnish data doesn't carry it.
const BASE_URL = 'https://meri.digitraffic.fi/api/port-call/v1/port-calls'
const HEADERS = { Accept: 'application/json', 'Digitraffic-User': 'didactic-pancake' }
const FETCH_TIMEOUT_MS = 10_000
const CACHE_TTL = 5 * 60_000

// UN/LOCODEs for Tallinn's passenger harbour as ships report them.
const TALLINN_LOCODES = new Set(['EETLL', 'EEVAN'])

// Usual crossing time in minutes, by ship (lower case). Others use the default.
const CROSSING_MINUTES: Record<string, number> = {
  megastar: 120,
  mystar: 120,
  star: 120,
}
const DEFAULT_CROSSING_MINUTES = 150
const MIN_REGULAR_VISITS = 3

export interface Sailing {
  id: string
  ship: string
  // to-foreign: Tallinn -> the foreign port; from-foreign: the reverse.
  direction: 'to-foreign' | 'from-foreign'
  departMs: number
  arriveMs: number
}

interface PortCall {
  vesselName?: string
  prevPort?: string
  nextPort?: string
  portAreaDetails?: { eta?: string | null; etd?: string | null; ata?: string | null; atd?: string | null }[]
}

const cache = new Map<string, { data: Sailing[]; timestamp: number }>()

function toMs(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function crossingMs(ship: string): number {
  return (CROSSING_MINUTES[ship.trim().toLowerCase()] ?? DEFAULT_CROSSING_MINUTES) * 60_000
}

export function sailingsFromPortCalls(calls: PortCall[]): Sailing[] {
  const sailings: Sailing[] = []
  for (const call of calls) {
    const detail = call.portAreaDetails?.[0]
    const ship = call.vesselName?.trim()
    if (!detail || !ship) continue
    const arrival = toMs(detail.ata) ?? toMs(detail.eta)
    const departure = toMs(detail.atd) ?? toMs(detail.etd)
    const crossing = crossingMs(ship)
    if (arrival !== null && call.prevPort && TALLINN_LOCODES.has(call.prevPort)) {
      sailings.push({ id: `${ship}-to-${arrival}`, ship, direction: 'to-foreign', departMs: arrival - crossing, arriveMs: arrival })
    }
    if (departure !== null && call.nextPort && TALLINN_LOCODES.has(call.nextPort)) {
      sailings.push({ id: `${ship}-from-${departure}`, ship, direction: 'from-foreign', departMs: departure, arriveMs: departure + crossing })
    }
  }
  // Regular ferries show up many times; one-off visitors (cruise ships) don't
  // belong in a trip planner.
  const visits = new Map<string, number>()
  for (const s of sailings) visits.set(s.ship, (visits.get(s.ship) ?? 0) + 1)
  const seen = new Set<string>()
  return sailings
    .filter((s) => (visits.get(s.ship) ?? 0) >= MIN_REGULAR_VISITS)
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
    .sort((a, b) => a.departMs - b.departMs)
}

// Sailings between Tallinn and the Finnish port with this UN/LOCODE.
export async function getSailings(locode: string, now: number = Date.now()): Promise<Sailing[]> {
  const cached = cache.get(locode)
  if (cached && now - cached.timestamp < CACHE_TTL) return cached.data
  const from = new Date(now - 24 * 3600_000).toISOString()
  const res = await fetch(`${BASE_URL}?locode=${locode}&from=${encodeURIComponent(from)}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Digitraffic port calls responded ${res.status}`)
  const json: { portCalls?: PortCall[] } = await res.json()
  const data = sailingsFromPortCalls(json.portCalls ?? [])
  cache.set(locode, { data, timestamp: now })
  return data
}
