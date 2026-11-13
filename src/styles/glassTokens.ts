export const ZYVO_COLORS = {
  primaryRed: '#E50914',
  secondaryRed: '#B20710',
  background: '#F8F8FA',
  glassWhite: 'rgba(255, 255, 255, 0.58)',
  glassSurface: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.75)',
  primaryText: '#171717',
  secondaryText: '#737373',
} as const;

export const LIQUID_EASE = [0.16, 1, 0.3, 1] as const;

export const GLASS_TRANSITION = {
  duration: 0.24,
  ease: LIQUID_EASE,
} as const;

export const GLASS_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const PAGE_TRANSITION_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: LIQUID_EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14, ease: LIQUID_EASE },
  },
};
