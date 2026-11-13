import React from 'react';

export type GlassPanelVariant = 'subtle' | 'default' | 'elevated' | 'dark';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  specular?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANT_CLASSES: Record<GlassPanelVariant, string> = {
  subtle: 'glass-white',
  default: 'glass-surface',
  elevated: 'glass-elevated',
  dark: 'glass-dark',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function GlassPanel({
  variant = 'default',
  specular = true,
  padding = 'md',
  className = '',
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl transition-shadow duration-200 ${VARIANT_CLASSES[variant]} ${
        specular ? 'glass-specular' : ''
      } ${PADDING_CLASSES[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
