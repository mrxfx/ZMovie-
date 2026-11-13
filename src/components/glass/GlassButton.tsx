import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type GlassButtonVariant = 'primary' | 'white' | 'glass' | 'darkGlass' | 'ghost' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never;
  };

type ButtonAsLink = BaseProps &
  LinkProps & {
    to: string;
  };

export type GlassButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_MAP: Record<GlassButtonVariant, string> = {
  primary:
    'bg-[#E50914] hover:bg-[#B20710] text-white shadow-[0_10px_26px_-6px_rgba(229,9,20,0.55)] border border-white/25',
  white:
    'bg-white hover:bg-white/90 text-[#171717] shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] border border-white',
  glass:
    'glass-control text-white hover:bg-white/22',
  darkGlass:
    'bg-black/35 hover:bg-black/50 backdrop-blur-md text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
  ghost:
    'bg-transparent hover:bg-white/12 text-white/90 hover:text-white border border-transparent',
  danger:
    'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/35 backdrop-blur-sm',
};

const SIZE_MAP: Record<GlassButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs min-h-[38px] rounded-full gap-1.5',
  md: 'px-4.5 py-2.5 text-sm min-h-[42px] rounded-full gap-2',
  lg: 'px-6 py-3 text-sm sm:text-base min-h-[46px] rounded-full gap-2',
};

export function GlassButton(props: GlassButtonProps) {
  const {
    variant = 'glass',
    size = 'md',
    className = '',
    children,
    ...rest
  } = props;

  const classes = `inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E50914] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${className}`;

  if ('to' in props && props.to !== undefined) {
    const { to, variant: _v, size: _s, className: _c, children: _ch, ...linkRest } =
      props as ButtonAsLink;
    return (
      <Link to={to} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const {
    type = 'button',
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    ...btnRest
  } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} {...btnRest}>
      {children}
    </button>
  );
}
