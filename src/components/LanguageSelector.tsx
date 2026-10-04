'use client'

import { useTranslation } from '@/lib/i18n/context'
import { Locale, LOCALES } from '@/lib/i18n/types'

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  et: 'Eesti',
  ru: 'Русский',
}

// Inline language picker for the Settings drawer.
export function LanguageFields() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('language.label')}</div>
      <div className="grid grid-cols-3 gap-1">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={l === locale}
            className={`px-2 py-1.5 rounded-lg text-xs ${
              l === locale
                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50 font-medium'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </div>
    </>
  )
}
