'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { useRiderProfile } from '@/hooks/use-rider-profile'
import { RiderCategory } from '@/lib/fares/tariffs'
import { CITIES } from '@/lib/constants'

const AGE_BANDS: RiderCategory[] = ['child', 'youth', 'adult', 'senior']

// The rider's fare profile (age band + residency), shown in Settings. Fare
// pricing (src/lib/fares/price.ts) reads the same hook directly wherever a
// RouteCard renders, so nothing needs plumbing through the search/plan calls.
export function RiderProfileFields() {
  const { t } = useTranslation()
  const { profile, setAgeBand, setResidentOf } = useRiderProfile()
  // The age hint only appears once the rider taps a band, and starts hidden
  // again the next time Settings is opened, to keep the screen uncluttered.
  const [showAges, setShowAges] = useState(false)

  return (
    <>
     <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('fare.profileTitle')}</div>
     <div className="grid grid-cols-2 gap-1 mb-3">
       {AGE_BANDS.map((band) => (
         <button
           key={band}
           type="button"
           onClick={() => {
             setAgeBand(band)
             setShowAges(true)
           }}
           className={`px-2 py-1.5 rounded-lg text-xs ${
             band === profile.ageBand
               ? 'text-white bg-[#051650] font-medium'
               : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
           }`}
         >
           {t(`fare.profile${band[0].toUpperCase()}${band.slice(1)}`)}
         </button>
       ))}
     </div>
     {showAges && (
       <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1.5 mb-3">
         <span className="font-medium text-gray-700 dark:text-gray-200">{t(`fare.age${profile.ageBand[0].toUpperCase()}${profile.ageBand.slice(1)}`)}</span>
         <br />
         {t('fare.ageNote')}
       </p>
     )}
     <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('fare.residentOf')}</label>
     <select
       value={profile.residentOf || ''}
       onChange={(e) => setResidentOf(e.target.value || undefined)}
       className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
     >
       <option value="">—</option>
       {CITIES.map((city) => (
         <option key={city.id} value={city.id}>
           {city.name}
         </option>
       ))}
     </select>
    </>
  )
}
