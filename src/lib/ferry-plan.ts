import { RouteLeg, RouteResult } from '@/lib/types'
import { PlanOptions, PlanResult, planTrip } from '@/lib/plan-query'
import { findForeignPortNear } from '@/lib/ferry-ports'
import { Sailing, getSailings } from '@/lib/ferry-sailings'
import { distanceMeters } from '@/lib/delay'
import { encodePolyline } from '@/lib/encode-polyline'

// Trip planning to/from a ferry port abroad. The route planner only knows
// Estonian transport, so a trip to Helsinki is built as: the normal Estonian
// trip to Tallinn's harbour + one ferry leg per sailing (see
// ferry-sailings.ts). A trip from Helsinki is the ferry leg + the normal
// Estonian trip from the harbour onward. Ports without sailing data (Stockholm,
// Mariehamn, Kapellskär) only get the Estonian part.

const TZ = 'Europe/Tallinn'
// Be at the harbour this long before departure / allow this long to disembark.
const CHECK_IN_BUFFER_MS = 30 * 60_000
const DISEMBARK_BUFFER_MS = 20 * 60_000
const AT_PORT_RADIUS_M = 1500
const CANDIDATE_SAILINGS = 5
const MAX_ROUTES = 4

function tzOffsetMs(ms: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(ms / 1000) * 1000
}

// "2026-10-05T09:30" (Tallinn local time, as sent by the datetime input) -> epoch ms.
function localToEpoch(local: string): number {
  const [date, time = '00:00'] = local.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  return guess - tzOffsetMs(guess - tzOffsetMs(guess))
}

function epochToLocal(ms: number): string {
  const shifted = new Date(ms + tzOffsetMs(ms))
  return shifted.toISOString().slice(0, 16)
}

function ferryLeg(sailing: Sailing, from: { name: string; lat: number; lng: number }, to: { name: string; lat: number; lng: number }): RouteLeg {
  return {
    mode: 'ferry',
    from: { name: from.name, lat: from.lat, lng: from.lng, departure: new Date(sailing.departMs).toISOString() },
    to: { name: to.name, lat: to.lat, lng: to.lng, arrival: new Date(sailing.arriveMs).toISOString() },
    startTime: new Date(sailing.departMs).toISOString(),
    endTime: new Date(sailing.arriveMs).toISOString(),
    duration: Math.round((sailing.arriveMs - sailing.departMs) / 1000),
    route: sailing.ship,
    legGeometry: { points: encodePolyline([[from.lng, from.lat], [to.lng, to.lat]]) },
  }
}

function compose(id: string, legs: RouteLeg[]): RouteResult {
  const start = Date.parse(legs[0].startTime)
  const end = Date.parse(legs[legs.length - 1].endTime)
  return {
    id,
    legs,
    duration: Math.round((end - start) / 1000),
    startTime: new Date(start).toISOString(),
    endTime: new Date(end).toISOString(),
    walkDistance: 0,
  }
}

function firstRoute(result: PlanResult): RouteResult | null {
  return result.routes?.[0] ?? null
}

export async function planWithFerries(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  options: PlanOptions = {},
): Promise<PlanResult> {
  const toPort = findForeignPortNear(toLat, toLng)
  const fromPort = findForeignPortNear(fromLat, fromLng)
  if (!toPort && !fromPort) return planTrip(fromLat, fromLng, toLat, toLng, options)
  if (toPort && fromPort) return { error: 'No routes found', status: 404 }

  const port = (toPort ?? fromPort)!
  const toForeign = !!toPort
  const harbour = port.estonianPort
  const foreignPlace = { name: port.names.en, lat: port.lat, lng: port.lng }
  const harbourPlace = { name: harbour.name, lat: harbour.lat, lng: harbour.lng }

  // Just the Estonian part of the trip, with a note why there's no ferry leg.
  const harbourOnly = async (reason: string): Promise<PlanResult> => {
    const res = toForeign
      ? await planTrip(fromLat, fromLng, harbour.lat, harbour.lng, options)
      : await planTrip(harbour.lat, harbour.lng, toLat, toLng, options)
    if (!res.routes) return res
    return {
      routes: res.routes,
      notice: `${reason} Showing the route ${toForeign ? 'to' : 'from'} ${harbour.name}. Ships are shown live on the map.`,
    }
  }

  // No sailing data for this port.
  if (!port.locode) return harbourOnly(`No ferry timetable is available for ${port.names.en}.`)

  let sailings: Sailing[]
  try {
    sailings = await getSailings(port.locode)
  } catch (error) {
    console.error('Failed to fetch ferry sailings:', error)
    return { error: 'Ferry timetable unavailable', status: 502 }
  }

  const reqMs = options.dateTime ? localToEpoch(options.dateTime) : Date.now()
  const arriveBy = !!options.arriveBy
  const wanted = sailings.filter((s) => s.direction === (toForeign ? 'to-foreign' : 'from-foreign'))
  const harbourDistance = toForeign
    ? distanceMeters(fromLat, fromLng, harbour.lat, harbour.lng)
    : distanceMeters(toLat, toLng, harbour.lat, harbour.lng)
  const atHarbour = harbourDistance <= AT_PORT_RADIUS_M

  // Which sailings to try, closest to the requested time first.
  let candidates: Sailing[]
  if (arriveBy) {
    candidates = wanted.filter((s) => s.arriveMs <= reqMs).sort((a, b) => b.arriveMs - a.arriveMs)
  } else {
    const earliest = toForeign ? reqMs + (atHarbour ? 0 : CHECK_IN_BUFFER_MS) : reqMs
    candidates = wanted.filter((s) => s.departMs >= earliest).sort((a, b) => a.departMs - b.departMs)
  }
  candidates = candidates.slice(0, CANDIDATE_SAILINGS)

  const built = await Promise.all(
    candidates.map(async (sailing): Promise<RouteResult | null> => {
      if (toForeign) {
        const ferry = ferryLeg(sailing, harbourPlace, foreignPlace)
        if (atHarbour) return compose(`ferry-${sailing.id}`, [ferry])
        // Plan the Estonian trip so it arrives at the harbour in time for this sailing.
        const before = firstRoute(
          await planTrip(fromLat, fromLng, harbour.lat, harbour.lng, {
            ...options,
            arriveBy: true,
            dateTime: epochToLocal(sailing.departMs - CHECK_IN_BUFFER_MS),
          }),
        )
        if (!before) return null
        // Can't leave before the requested time.
        if (!arriveBy && Date.parse(before.startTime) < reqMs - 60_000) return null
        return compose(`ferry-${sailing.id}`, [...before.legs, ferry])
      }
      const ferry = ferryLeg(sailing, foreignPlace, harbourPlace)
      if (atHarbour) return compose(`ferry-${sailing.id}`, [ferry])
      const after = firstRoute(
        await planTrip(harbour.lat, harbour.lng, toLat, toLng, {
          ...options,
          arriveBy: false,
          dateTime: epochToLocal(sailing.arriveMs + DISEMBARK_BUFFER_MS),
        }),
      )
      if (!after) return null
      if (arriveBy && Date.parse(after.endTime) > reqMs) return null
      return compose(`ferry-${sailing.id}`, [ferry, ...after.legs])
    }),
  )

  const routes = built
    .filter((r): r is RouteResult => r !== null)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    .slice(0, MAX_ROUTES)
  if (routes.length === 0) return harbourOnly('No ferry sailings are listed for this time (the port data only covers sailings announced a short time ahead).')
  return {
    routes,
    notice: `Ferry times: the ${port.names.en} end comes from port data; the ${harbour.name} end is estimated (about ±30 min).`,
  }
}
