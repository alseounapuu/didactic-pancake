import { buildShipTrip } from '../ships'
import { decodePolyline } from '../decode-polyline'
import { ShipPosition } from '../types'

function ship(destination: string, overrides: Partial<ShipPosition> = {}): ShipPosition {
  return { id: 'ship:1', name: 'TEST', lat: 58.9, lng: 23.3, heading: 90, speedKnots: 8, destination, ...overrides }
}

describe('buildShipTrip', () => {
  it.each([
    ['Tallinn ↔ Helsinki', ['Tallinn', 'Helsinki']],
    ['ROHUKYLA-HELTERMAA', ['Rohuküla', 'Heltermaa']],
    ['ROHUKYLA=HELTERMAA L', ['Rohuküla', 'Heltermaa']],
    ['SVIBY ↔ ROHUKULA', ['Sviby', 'Rohuküla']],
    ['LEPPNEEME ↔ KELNASE', ['Leppneeme', 'Kelnase']],
  ])('finds the ports in %s', (destination, names) => {
    const trip = buildShipTrip(ship(destination), 0)
    expect(trip?.stops.map((s) => s.name).sort()).toEqual([...names].sort())
  })

  it('returns nothing when no port is recognised', () => {
    expect(buildShipTrip(ship('DE TRAVEMUNDE'), 0)).toBeNull()
  })

  it('still draws a line when only one port is named', () => {
    const trip = buildShipTrip(ship('FIVSS ↔ Muuga'), 0)
    expect(trip?.stops).toHaveLength(1)
    // Ship position plus the port: a polyline with a segment to draw.
    expect(decodePolyline(trip!.geometry)).toHaveLength(2)
  })
})
