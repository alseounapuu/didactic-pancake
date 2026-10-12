import { sortRoutesChronologically } from '../sort-routes'
import { RouteResult } from '../types'

const route = (id: string, startTime: string, endTime: string): RouteResult =>
  ({ id, startTime, endTime, duration: 0, walkDistance: 0, legs: [] }) as RouteResult

describe('sortRoutesChronologically', () => {
  it('orders by departure time and renumbers ids', () => {
    const sorted = sortRoutesChronologically([
      route('route-0', '2026-10-13T08:00:00Z', '2026-10-13T09:00:00Z'),
      route('route-1', '2026-10-12T20:00:00Z', '2026-10-12T21:00:00Z'),
      route('route-2', '2026-10-13T07:00:00Z', '2026-10-13T08:30:00Z'),
    ])
    expect(sorted.map((r) => r.startTime)).toEqual([
      '2026-10-12T20:00:00Z',
      '2026-10-13T07:00:00Z',
      '2026-10-13T08:00:00Z',
    ])
    expect(sorted.map((r) => r.id)).toEqual(['route-0', 'route-1', 'route-2'])
  })

  it('breaks departure ties by earliest arrival', () => {
    const sorted = sortRoutesChronologically([
      route('a', '2026-10-12T20:00:00Z', '2026-10-12T22:00:00Z'),
      route('b', '2026-10-12T20:00:00Z', '2026-10-12T21:00:00Z'),
    ])
    expect(sorted[0].endTime).toBe('2026-10-12T21:00:00Z')
  })
})
