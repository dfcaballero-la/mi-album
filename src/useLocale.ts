import { useEffect, useState } from 'react';
import { translations, type Locale } from '@core/i18n';
import { getLocale, setLocale as persistLocale } from '@data/db';

const DEFAULT_LOCALE: Locale = 'es';

function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

/** Elige 'es' o 'en': recuerda la última elección, si no hay ninguna detecta el idioma del navegador. */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    void (async () => {
      const saved = await getLocale();
      setLocaleState(saved ?? detectLocale());
    })();
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    void persistLocale(next);
  };

  return { locale, t: translations[locale], setLocale };
}
