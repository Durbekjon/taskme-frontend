'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { clsx } from 'clsx';

interface StatWidgetProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ElementType;
  trend?: { value: string; positive: boolean };
  variant?: 'light' | 'dark';
  className?: string;
}

export function StatWidget({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  variant = 'light',
  className,
}: StatWidgetProps) {
  return (
    <div className={clsx('p-4 flex flex-col gap-2', className)}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <p className={clsx(
          'text-[10px] font-semibold uppercase tracking-wider',
          variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          {label}
        </p>
        {Icon && (
          <div className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            variant === 'dark' ? 'bg-white/10' : 'bg-gray-100'
          )}>
            <Icon size={14} color="currentColor" variant="Linear" className={clsx(
              variant === 'dark' ? 'text-white' : 'text-gray-900'
            )} />
          </div>
        )}
      </div>

      {/* Value */}
      <AnimatedValue value={value} variant={variant} />

      {/* Footer */}
      <div className="flex items-center gap-2">
        {trend && (
          <span className={clsx(
            'text-[10px] font-medium flex items-center gap-1',
            trend.positive ? 'text-emerald-500' : 'text-red-400'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
        {subtext && (
          <p className={clsx(
            'text-[10px]',
            variant === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function AnimatedValue({ value, variant }: { value: string; variant: string }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 100, damping: 25 });

  useEffect(() => { motionVal.set(1); }, [motionVal]);

  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'text-2xl font-bold tracking-tight',
        variant === 'dark' ? 'text-white' : 'text-gray-900'
      )}
    >
      {value}
    </motion.p>
  );
}
