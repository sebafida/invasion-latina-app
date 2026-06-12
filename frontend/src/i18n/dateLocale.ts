// Maps the app language to a BCP 47 locale for date/time formatting
import type { Language } from './translations';

const LOCALE_MAP: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  nl: 'nl-BE',
};

export function getDateLocale(language: Language): string {
  return LOCALE_MAP[language] || 'fr-FR';
}
