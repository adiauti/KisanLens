'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { routing, useRouter, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (newLocale: 'en' | 'hi' | 'mr') => {
    // `usePathname` from `@/i18n/routing` already strips the locale prefix,
    // so we just pass it through with the new locale.
    const innerPath = pathname || '/';
    router.replace(innerPath, { locale: newLocale });
    setOpen(false);
  };

  // Native names — independent of the current locale so the button label
  // is always readable when switching.
  const labels: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी',
    mr: 'मराठी',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-leaf-700 hover:bg-leaf-50 ring-1 ring-leaf-200 transition-colors"
        aria-label={t('selectLanguage')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{labels[locale]}</span>
        <span className="sm:hidden uppercase">{locale}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-cardHover ring-1 ring-leaf-100 overflow-hidden animate-fade-in z-50"
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              onClick={() => switchTo(l as 'en' | 'hi' | 'mr')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-leaf-50 transition-colors',
                l === locale ? 'text-leaf-900 font-semibold' : 'text-leaf-700'
              )}
            >
              <span>{labels[l]}</span>
              {l === locale && <Check className="w-4 h-4 text-leaf-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
