import { hasSafeTransfers } from '../plan-query'

const bus = (start: string, end: string) => ({
  mode: 'BUS',
  start: { scheduledTime: start },
  end: { scheduledTime: end },
  duration: 0,
})
const walk = (seconds: number) => ({ mode: 'WALK', start: { scheduledTime: '' }, end: { scheduledTime: '' }, duration: seconds })

// Only the fields hasSafeTransfers reads.
const journey = (...legs: unknown[]) => ({ legs }) as unknown as Parameters<typeof hasSafeTransfers>[0]

describe('hasSafeTransfers', () => {
  it('accepts a single vehicle', () => {
    expect(hasSafeTransfers(journey(bus('2026-10-13T10:00:00Z', '2026-10-13T10:20:00Z')))).toBe(true)
  })

  it('rejects a change with less than 4 minutes to wait', () => {
    expect(
      hasSafeTransfers(journey(bus('2026-10-13T10:00:00Z', '2026-10-13T10:20:00Z'), bus('2026-10-13T10:23:00Z', '2026-10-13T10:40:00Z'))),
    ).toBe(false)
  })

  it('accepts exactly 4 minutes', () => {
    expect(
      hasSafeTransfers(journey(bus('2026-10-13T10:00:00Z', '2026-10-13T10:20:00Z'), bus('2026-10-13T10:24:00Z', '2026-10-13T10:40:00Z'))),
    ).toBe(true)
  })

  it('does not count walking between the vehicles as waiting', () => {
    // 6 min gap, 3 min of it walking -> only 3 min to wait
    expect(
      hasSafeTransfers(journey(bus('2026-10-13T10:00:00Z', '2026-10-13T10:20:00Z'), walk(180), bus('2026-10-13T10:26:00Z', '2026-10-13T10:40:00Z'))),
    ).toBe(false)
  })
})
