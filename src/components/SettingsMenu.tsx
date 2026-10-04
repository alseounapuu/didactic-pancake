'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'
import { LanguageFields } from './LanguageSelector'
import { RiderProfileFields } from './RiderProfileSelector'
import { useLocationSetting } from '@/hooks/use-location-setting'

export function SettingsMenu({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const { t } = useTranslation()
  const { enabled, setEnabled } = useLocationSetting()
  return (
    <MenuDrawer title={t('menu.settings')} onClose={onClose} onBack={onBack}>
      <div className="p-4 flex flex-col gap-5">
        <div>
          <LanguageFields />
        </div>
        <div>
          <RiderProfileFields />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('menu.location')}</div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span>{t('menu.allowLocation')}</span>
            <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${enabled ? 'bg-[#00022E]' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-[1.125rem]' : 'left-0.5'}`} />
            </span>
          </button>
        </div>
      </div>
    </MenuDrawer>
  )
}
