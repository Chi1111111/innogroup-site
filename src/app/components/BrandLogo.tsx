import { useState } from 'react';
import { logoMarkImage } from '../../data/pic';

type BrandLogoVariant = 'nav' | 'hero' | 'plaque' | 'watermark';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  eyebrow?: string;
}

const shellClasses: Record<BrandLogoVariant, string> = {
  nav: 'inline-flex items-center',
  hero:
    'inline-flex flex-col gap-2.5 rounded-full border border-white/60 bg-white/92 px-3 py-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.22)] ring-1 ring-black/5 sm:gap-3 sm:px-4 sm:py-3',
  plaque:
    'inline-flex flex-col gap-3 rounded-full border border-white/60 bg-white/94 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.22)] ring-1 ring-black/5',
  watermark:
    'inline-flex flex-col gap-2 rounded-full border border-white/30 bg-white/16 px-3 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] backdrop-blur-md',
};

const bodyClasses: Record<BrandLogoVariant, string> = {
  nav: 'gap-3',
  hero: 'gap-3 sm:gap-4',
  plaque: 'gap-3.5',
  watermark: 'gap-3',
};

const iconFrameClasses: Record<BrandLogoVariant, string> = {
  nav: 'h-12 w-12 rounded-[18px] bg-[#111214] ring-1 ring-black/8 shadow-[0_10px_24px_rgba(0,0,0,0.14)]',
  hero: 'h-12 w-12 rounded-[18px] border border-black/5 bg-[#18191c] shadow-[0_10px_26px_rgba(0,0,0,0.14)] sm:h-14 sm:w-14 sm:rounded-[20px]',
  plaque: 'h-12 w-12 rounded-[18px] border border-black/5 bg-[#18191c] shadow-[0_10px_24px_rgba(0,0,0,0.14)]',
  watermark: 'h-10 w-10 rounded-[14px] border border-white/16 bg-[#18191c]/90',
};

const iconImageClasses: Record<BrandLogoVariant, string> = {
  nav: 'h-8 w-8',
  hero: 'h-8 w-8 sm:h-9 sm:w-9',
  plaque: 'h-8 w-8',
  watermark: 'h-7 w-7 opacity-90',
};

const titleClasses: Record<BrandLogoVariant, string> = {
  nav: 'text-[17px] font-semibold uppercase tracking-[0.34em] text-[#111214]',
  hero: 'text-[15px] font-semibold uppercase tracking-[0.24em] text-[#161616] sm:text-[19px] sm:tracking-[0.34em]',
  plaque: 'text-[16px] font-semibold uppercase tracking-[0.3em] text-[#161616]',
  watermark: 'text-[13px] font-semibold uppercase tracking-[0.24em] text-white/90',
};

const subtitleClasses: Record<BrandLogoVariant, string> = {
  nav: 'text-[10px] font-medium uppercase tracking-[0.22em] text-primary/85',
  hero: 'text-[9px] font-medium uppercase tracking-[0.16em] text-primary/80 sm:text-[10px] sm:tracking-[0.24em]',
  plaque: 'text-[10px] font-medium uppercase tracking-[0.22em] text-primary/75',
  watermark: 'text-[9px] font-medium uppercase tracking-[0.18em] text-white/70',
};

export function BrandLogo({ variant = 'hero', className = '', eyebrow }: BrandLogoProps) {
  const [markError, setMarkError] = useState(false);
  const isLightPillVariant = variant === 'hero' || variant === 'plaque';

  return (
    <div className={`${shellClasses[variant]} ${className}`.trim()}>
      {eyebrow ? (
        <div className="flex items-center justify-center gap-3 px-3">
          <span className="h-px w-7 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/85 whitespace-nowrap">
            {eyebrow}
          </span>
          <span className="h-px w-7 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      ) : null}

      <div className={`flex items-center ${bodyClasses[variant]}`}>
        {!markError ? (
          <div className={`flex items-center justify-center ${iconFrameClasses[variant]}`}>
            <img
              src={logoMarkImage}
              alt="Inno Group mark"
              className={`${iconImageClasses[variant]} object-contain`}
              onError={() => setMarkError(true)}
            />
          </div>
        ) : null}

        <div className="flex flex-col">
          <span
            className={`${titleClasses[variant]} ${isLightPillVariant ? 'brand-logo-title' : ''}`.trim()}
          >
            Inno Group Ltd
          </span>
          <span
            className={`${subtitleClasses[variant]} ${isLightPillVariant ? 'brand-logo-subtitle' : ''}`.trim()}
          >
            Japan Direct Sourcing
          </span>
        </div>
      </div>
    </div>
  );
}
