import { clsx } from 'clsx';

export type BadgeStatus = 'pending' | 'confirmed' | 'overdue' | 'paid' | 'draft' | 'active' | 'processing' | 'declined';

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
  dot?: boolean;
  className?: string;
}

const STATUS_STYLES: Record<BadgeStatus, string> = {
  pending:    'bg-gray-100 text-gray-700',
  confirmed:  'bg-black text-white shadow-sm',
  overdue:    'bg-gray-200 text-black',
  paid:       'bg-black text-white shadow-sm',
  draft:      'glass text-gray-800 border border-black/10',
  active:     'bg-black text-white shadow-sm',
  processing: 'bg-gray-100 text-gray-700',
  declined:   'bg-gray-200 text-black',
};

const DOT_COLORS: Record<BadgeStatus, string> = {
  pending:    'bg-gray-400',
  confirmed:  'bg-white/70',
  overdue:    'bg-gray-500',
  paid:       'bg-white/70',
  draft:      'bg-gray-400',
  active:     'bg-white/70',
  processing: 'bg-gray-400',
  declined:   'bg-gray-500',
};

const DEFAULT_LABELS: Record<BadgeStatus, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  overdue:    'Overdue',
  paid:       'Paid',
  draft:      'Draft',
  active:     'Active',
  processing: 'Processing',
  declined:   'Declined',
};

export function Badge({ status, label, dot = true, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      STATUS_STYLES[status],
      className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_COLORS[status])} />}
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
}
