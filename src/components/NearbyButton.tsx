'use client'

import { LocateFixed } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

interface NearbyButtonProps {
  active: boolean
  onClick: () => void
}

export function NearbyButton({ active, onClick }: NearbyButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? t('nearbyButton.hide') : t('nearbyButton.show')}
      className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-2 backdrop-blur-xl ${
        active
          ? 'bg-[#00022E] border-[#00022E]'
          : 'bg-white/85 dark:bg-gray-900/80 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      title={active ? t('nearbyButton.hide') : t('nearbyButton.show')}
    >
      <LocateFixed
        size={22}
        strokeWidth={2}
        className={active ? 'text-white' : 'text-gray-600 dark:text-gray-300'}
      />
    </button>
  )
}
