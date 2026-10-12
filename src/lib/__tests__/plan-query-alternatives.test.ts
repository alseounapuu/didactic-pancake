import { planTrip } from '../plan-query'

function itinerary(tripId: string, line: string, start: string, end: string) {
  const place = { name: 'A', lat: 59.4, lon: 24.7, stop: { gtfsId: '1:s1' } }
  return {
    duration: 600,
    startTime: Date.parse(start),
    endTime: Date.parse(end),
    walkDistance: 100,
    legs: [
      {
        mode: 'BUS',
        start: { scheduledTime: start },
        end: { scheduledTime: end },
        from: place,
        to: { ...place, name: 'B' },
        duration: 600,
        route: { gtfsId: `1:${line}`, shortName: line },
        trip: { gtfsId: tripId, wheelchairAccessible: null },
      },
    ],
  }
}

describe('hidden alternatives', () => {
  it('re-searches with found trips banned and lists the vehicles that turn up', async () => {
    const sentBanned: (string | undefined)[] = []
    global.fetch = jest.fn(async (_url: unknown, init?: { body?: string }) => {
      const vars = JSON.parse(init?.body ?? '{}').variables
      const banned: string | undefined = vars.banned?.trips
      sentBanned.push(banned)
      let itineraries: unknown[] = []
      if (!banned) itineraries = [itinerary('1:t5', '5', '2026-10-12T20:00:00Z', '2026-10-12T20:10:00Z')]
      else if (!banned.includes('1:t8')) itineraries = [itinerary('1:t8', '8', '2026-10-12T20:01:00Z', '2026-10-12T20:12:00Z')]
      return { ok: true, json: async () => ({ data: { plan: { itineraries } } }) }
    }) as unknown as typeof fetch

    const result = await planTrip(59.4, 24.7, 59.5, 24.8, { modes: ['bus'] })

    expect(result.routes?.map((r) => r.legs[0].route)).toEqual(['5', '8'])
    expect(sentBanned[1]).toBe('1:t5')
    expect(sentBanned[2]).toBe('1:t5,1:t8')
  })
})
