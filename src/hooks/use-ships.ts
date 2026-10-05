import { usePolling } from './use-polling'
import { ShipPosition } from '@/lib/types'

interface ShipsResponse {
  ships: ShipPosition[]
  timestamp: number
}

const SHIPS_POLL_INTERVAL = 30_000 // ms; the feed itself is cached ~30s server-side

export function useShips(enabled: boolean = true) {
  const { data } = usePolling<ShipsResponse>(
    async () => {
      const res = await fetch('/api/ships')
      if (!res.ok) throw new Error('Failed to fetch ships')
      return res.json()
    },
    SHIPS_POLL_INTERVAL,
    enabled,
  )
  return data?.ships
}
