'use client';

import { useId } from 'react';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  variant?: 'dark' | 'light';
  showLabels?: boolean;
  className?: string;
}

const GRADIENT_IDS: Record<string, string> = {
  'dark': 'gradient-dark',
  'light': 'gradient-light',
};

export function MiniBarChart({
  data,
  height = 120,
  variant = 'dark',
  showLabels = true,
  className = '',
}: MiniBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / (data.length * 2 - 1);

  const gradients: Record<string, [string, string]> = {
    'dark': ['#000000', '#374151'], // black to gray-700
    'light': ['#D1D5DB', '#9CA3AF'],
  };

  const [fromColor, toColor] = gradients[variant] ?? gradients['dark'];
  // Math.random() during render is impure and produces a different id on
  // every pass; useId gives a stable, unique one.
  const gradientId = `${GRADIENT_IDS[variant]}-${useId().replace(/[:]/g, '')}`;

  return (
    <div className={`w-full ${className}`}>
      <svg width="100%" height={height + (showLabels ? 20 : 0)} viewBox={`0 0 100 ${height + (showLabels ? 20 : 0)}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {data.map((bar, idx) => {
          const normalizedHeight = (bar.value / maxValue) * height;
          const x = idx * (barWidth * 2);
          const y = height - normalizedHeight;

          return (
            <g key={`${bar.label}-${idx}`}>
              <rect
                x={`${x}%`}
                y={y}
                width={`${barWidth}%`}
                height={normalizedHeight}
                fill={`url(#${gradientId})`}
                rx="3"
                ry="3"
                opacity={idx === data.length - 1 ? 1 : 0.6 + (idx / data.length) * 0.4}
              />
              {showLabels && (
                <text
                  x={`${x + barWidth / 2}%`}
                  y={height + 14}
                  textAnchor="middle"
                  fontSize="5"
                  fill="#9CA3AF"
                  fontFamily="Inter, sans-serif"
                >
                  {bar.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
