'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Leaf } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Strip locale prefix for comparison
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  const navItems = [
    { href: '/', label: t('home') },
    { href: '/library', label: t('library') },
    { href: '/wizard', label: t('wizard') },
    { href: '/crops', label: t('crops') },
    { href: '/advisory', label: t('advisory') },
    { href: '/about', label: t('about') },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathWithoutLocale === '/';
    return pathWithoutLocale.startsWith(href);
  };

  // Build href for current locale
  const localizedHref = (href: string) =>
    href === '/' ? `/${locale}` : `/${locale}${href}`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-cream-50/85 border-b border-leaf-100">
      <div className="container-narrow">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href={localizedHref('/')}
            className="flex items-center gap-2 group"
            aria-label={tBrand('name')}
          >
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-leaf-600 text-white shadow-soft group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold text-leaf-900">
                {tBrand('name')}
              </span>
              <span className="text-[10px] text-leaf-600 -mt-0.5 hidden sm:block">
                {tBrand('tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={localizedHref(item.href)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-leaf-100 text-leaf-900'
                    : 'text-leaf-700 hover:bg-leaf-50 hover:text-leaf-900'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg text-leaf-700 hover:bg-leaf-50"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="lg:hidden pb-4 pt-2 animate-fade-in">
            <ul className="grid gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localizedHref(item.href)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-leaf-100 text-leaf-900'
                        : 'text-leaf-700 hover:bg-leaf-50'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}

// suppress unused import warning for routing (used by LanguageSwitcher)
void routing;
