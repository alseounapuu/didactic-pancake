// Tallinn's own live arrivals per stop (transport.tallinn.ee), the feed behind
// its stop displays. Unlike OTP's timetable (no realtime for Tallinn), every
// row carries both the expected and the scheduled time, so a bus running late
// is visible per stop. Times are seconds since midnight.
const STOPS_URL = 'https://transport.tallinn.ee/data/stops.txt'
const SIRI_URL = 'https://transport.tallinn.ee/siri-stop-departures.php'
const STOPS_TTL_MS = 6 * 60 * 60_000
const FETCH_TIMEOUT_MS = 3_000

export interface SiriDeparture {
  type: string
  line: string
  expectedSec: number
  scheduledSec: number
}

let siriIdsCache: { map: Map<string, string>; fetchedAt: number } | null = null

// GTFS stop id (e.g. "16215-1") -> Tallinn's own SiriID (e.g. "100").
async function getSiriIds(): Promise<Map<string, string>> {
  if (siriIdsCache && Date.now() - siriIdsCache.fetchedAt < STOPS_TTL_MS) return siriIdsCache.map
  try {
    const res = await fetch(STOPS_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS * 3) })
    if (!res.ok) throw new Error(`stops.txt ${res.status}`)
    const map = new Map<string, string>()
    for (const line of (await res.text()).split(/\r?\n/).slice(1)) {
      const [id, siriId] = line.split(';')
      if (id && siriId) map.set(id.trim(), siriId.trim())
    }
    siriIdsCache = { map, fetchedAt: Date.now() }
    return map
  } catch {
    return siriIdsCache?.map ?? new Map()
  }
}

export async function getSiriId(gtfsStopId: string): Promise<string | undefined> {
  return (await getSiriIds()).get(gtfsStopId)
}

export async function fetchSiriDepartures(siriId: string): Promise<SiriDeparture[]> {
  try {
    const res = await fetch(`${SIRI_URL}?stopid=${encodeURIComponent(siriId)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return []
    const rows: SiriDeparture[] = []
    // Header lines ("Transport,..." and "stop,<id>") don't have numeric times.
    for (const raw of (await res.text()).split(/\r?\n/)) {
      const [type, line, expected, scheduled] = raw.split(',')
      const expectedSec = Number(expected)
      const scheduledSec = Number(scheduled)
      if (!type || !line || !Number.isFinite(expectedSec) || !Number.isFinite(scheduledSec) || expected === '' || scheduled === '') continue
      rows.push({ type, line, expectedSec, scheduledSec })
    }
    return rows
  } catch {
    return []
  }
}

// Delay (seconds) of the SIRI row matching this OTP departure, if any: same
// line, scheduled within a minute (rounding between the two feeds).
export function siriDelayFor(
  rows: SiriDeparture[],
  line: string,
  isTram: boolean,
  scheduledDepartureSec: number,
): number | undefined {
  const wanted = (isTram ? line.replace(/^T/i, '') : line).toLowerCase()
  const day = 86400
  const target = ((scheduledDepartureSec % day) + day) % day
  const row = rows.find((r) => {
    if (r.line.toLowerCase() !== wanted) return false
    const diff = Math.abs((((r.scheduledSec % day) + day) % day) - target)
    return Math.min(diff, day - diff) <= 60
  })
  return row ? row.expectedSec - row.scheduledSec : undefined
}
