'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

type BentoVariant = 'light' | 'dark' | 'glass' | 'indigo';
type BentoSize = '1x1' | '1x2' | '2x1' | '2x2' | '3x1' | '1x3' | 'auto';

interface BentoCardProps {
  children: React.ReactNode;
  variant?: BentoVariant;
  size?: BentoSize;
  className?: string;
  hover?: boolean;
  colSpan?: number;
  rowSpan?: number;
  onClick?: () => void;
}

const SIZE_CLASSES: Record<BentoSize, string> = {
  '1x1': 'col-span-1 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x1': 'col-span-2 row-span-1',
  '2x2': 'col-span-2 row-span-2',
  '3x1': 'col-span-3 row-span-1',
  '1x3': 'col-span-1 row-span-3',
  'auto': '',
};

const VARIANT_CLASSES: Record<BentoVariant, string> = {
  light:  'glass',
  dark:   'card-black border-none',
  glass:  'glass',
  indigo: 'card-black border-none',
};

export function BentoCard({
  children,
  variant = 'light',
  size = 'auto',
  className,
  hover = true,
  colSpan,
  rowSpan,
  onClick,
}: BentoCardProps) {
  const spanStyles = [
    colSpan ? `col-span-${colSpan}` : '',
    rowSpan ? `row-span-${rowSpan}` : '',
  ].join(' ');

  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 48px rgba(0,0,0,0.08)' } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={clsx(
        'rounded-[var(--radius-card)] overflow-hidden',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        spanStyles,
        hover && 'cursor-default',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
