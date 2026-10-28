'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

// motion.button and React's button props disagree on the animation-related
// handlers, so extend the motion props directly rather than casting at the
// spread site.
interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ElementType;
  iconPosition?: 'left' | 'right';
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:   'bg-black text-white hover:bg-gray-900 shadow-md',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ghost:     'bg-transparent text-gray-600 hover:bg-black/5 border border-black/10',
  danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200',
  glass:     'glass text-gray-800 hover:bg-white/80 border border-white/30',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs gap-1.5 rounded-full',
  md: 'px-5 py-2 text-sm gap-2 rounded-full',
  lg: 'px-6 py-3 text-sm gap-2.5 rounded-full',
};

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={14} strokeWidth={2} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={14} strokeWidth={2} />}
    </motion.button>
  );
}
