'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'
import { RiderProfileFields } from './RiderProfileSelector'

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <MenuDrawer title={t('menu.settings')} onClose={onClose}>
      <div className="p-4">
        <RiderProfileFields />
      </div>
    </MenuDrawer>
  )
}
