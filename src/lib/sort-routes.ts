import { RouteResult } from './types'

// The routing server returns itineraries in its own order (and the ferry
// planner builds its own), so a rider could see tomorrow's trip, then tonight's,
// then tomorrow's again. Earliest departure first, then earliest arrival.
// Ids are reassigned afterwards so "route-0" is always the first one listed.
export function sortRoutesChronologically(routes: RouteResult[]): RouteResult[] {
  return [...routes]
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime() ||
        new Date(a.endTime).getTime() - new Date(b.endTime).getTime(),
    )
    .map((route, index) => ({ ...route, id: `route-${index}` }))
}
