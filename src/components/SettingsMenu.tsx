'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'
import { LanguageFields } from './LanguageSelector'
import { RiderProfileFields } from './RiderProfileSelector'

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <MenuDrawer title={t('menu.settings')} onClose={onClose}>
      <div className="p-4 flex flex-col gap-5">
        <div>
          <LanguageFields />
        </div>
        <div>
          <RiderProfileFields />
        </div>
      </div>
    </MenuDrawer>
  )
}
