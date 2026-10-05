import { NextResponse } from 'next/server'
import { fetchShips } from '@/lib/ships'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ships = await fetchShips()
    return NextResponse.json({ ships, timestamp: Date.now() })
  } catch (err) {
    console.error('ships feed failed', err)
    return NextResponse.json({ ships: [], timestamp: Date.now(), error: 'unavailable' }, { status: 502 })
  }
}
