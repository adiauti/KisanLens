import { useTranslations } from 'next-intl';
import { Leaf, Heart } from 'lucide-react';

export function SiteFooter() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tAbout = useTranslations('about');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-leaf-900 text-leaf-50">
      <div className="container-narrow py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-leaf-600 text-white">
                <Leaf className="w-5 h-5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-bold">
                {tBrand('name')}
              </span>
            </div>
            <p className="text-leaf-200 text-sm leading-relaxed">
              {tBrand('tagline')}.
            </p>
            <p className="text-leaf-300 text-xs mt-4 flex items-center gap-1.5">
              <Heart className="w-3 h-3 fill-current text-red-400" />
              {t('built')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">{tNav('library')}</h3>
            <ul className="space-y-2 text-sm text-leaf-200">
              <li>{tNav('home')}</li>
              <li>{tNav('library')}</li>
              <li>{tNav('wizard')}</li>
              <li>{tNav('crops')}</li>
              <li>{tNav('advisory')}</li>
              <li>{tNav('about')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">
              {tAbout('disclaimerTitle')}
            </h3>
            <p className="text-leaf-200 text-xs leading-relaxed">
              {tAbout('disclaimerBody')}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-leaf-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-leaf-300">
            {t('copyright', { year })}
          </p>
          <p className="text-xs text-leaf-300">{t('free')}</p>
        </div>
      </div>
    </footer>
  );
}
