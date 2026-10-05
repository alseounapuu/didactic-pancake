'use client'

import { useTranslation } from '@/lib/i18n/context'
import { MenuDrawer } from './MenuDrawer'
import { LanguageFields } from './LanguageSelector'
import { RiderProfileFields } from './RiderProfileSelector'
import { useLocationSetting } from '@/hooks/use-location-setting'
import { useShowAllVehicles } from '@/hooks/use-show-all-vehicles'
import { useShowShips } from '@/hooks/use-show-ships'

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <span className="text-left">{label}</span>
      <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${checked ? 'bg-[#051650]' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

// On/off switch with a label on each side: "off" label left, "on" label
// right; the label of the current state is emphasized.
function LabeledSwitch({ offLabel, onLabel, checked, onChange }: { offLabel: string; onLabel: string; checked: boolean; onChange: (next: boolean) => void }) {
  const active = 'font-semibold text-gray-900 dark:text-gray-100'
  const inactive = 'text-gray-400 dark:text-gray-500'
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
      <button type="button" onClick={() => onChange(false)} className={checked ? inactive : active}>
        {offLabel}
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${offLabel} / ${onLabel}`}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${checked ? 'bg-[#051650]' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </button>
      <button type="button" onClick={() => onChange(true)} className={checked ? active : inactive}>
        {onLabel}
      </button>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{children}</div>
}

interface SettingsMenuProps {
  onClose: () => void
  onBack: () => void
  wheelchair: boolean
  onWheelchairToggle: () => void
}

export function SettingsMenu({ onClose, onBack, wheelchair, onWheelchairToggle }: SettingsMenuProps) {
  const { t } = useTranslation()
  const { enabled, setEnabled } = useLocationSetting()
  const { showAll, setShowAll } = useShowAllVehicles()
  const { showShips, setShowShips } = useShowShips()
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
          <SectionTitle>{t('menu.location')}</SectionTitle>
          <SwitchRow label={t('menu.allowLocation')} checked={enabled} onChange={setEnabled} />
        </div>
        <div>
          <SectionTitle>{t('menu.wheelchair')}</SectionTitle>
          <SwitchRow
            label={wheelchair ? t('search.wheelchairOn') : t('search.wheelchairOff')}
            checked={wheelchair}
            onChange={onWheelchairToggle}
          />
        </div>
        <div>
          <SectionTitle>{t('menu.vehicles')}</SectionTitle>
          <LabeledSwitch offLabel={t('menu.myVehicles')} onLabel={t('menu.allVehicles')} checked={showAll} onChange={setShowAll} />
          {!showAll && <p className="px-2 mt-1 text-xs text-gray-500 dark:text-gray-400">{t('menu.showAllVehiclesHint')}</p>}
        </div>
        <div>
          <SectionTitle>{t('menu.ships')}</SectionTitle>
          <SwitchRow label={t('menu.showShips')} checked={showShips} onChange={setShowShips} />
        </div>
      </div>
    </MenuDrawer>
  )
}
