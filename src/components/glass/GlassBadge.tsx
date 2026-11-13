import React from 'react';

export type GlassBadgeVariant = 'default' | 'red' | 'dark' | 'rating' | 'subtle';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassBadgeVariant;
  size?: 'xs' | 'sm';
}

const BADGE_VARIANTS: Record<GlassBadgeVariant, string> = {
  default: 'glass-badge text-white',
  subtle:
    'bg-white/14 backdrop-blur-md border border-white/22 text-white/95',
  red: 'bg-[#E50914]/90 backdrop-blur-md border border-white/25 text-white shadow-[0_6px_16px_-4px_rgba(229,9,20,0.45)]',
  dark: 'bg-black/48 backdrop-blur-md border border-white/22 text-white shadow-sm',
  rating:
    'bg-black/55 backdrop-blur-md border border-white/25 text-white font-mono-tabular shadow-sm',
};

const BADGE_SIZES = {
  xs: 'px-2.5 py-1 text-[11px] rounded-full gap-1',
  sm: 'px-3 py-1 text-xs rounded-full gap-1.5',
};

export function GlassBadge({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...rest
}: GlassBadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium leading-none whitespace-nowrap ${BADGE_VARIANTS[variant]} ${BADGE_SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
