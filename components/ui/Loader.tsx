'use client';

import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export default function Loader({ size = 'md', fullPage = false }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const loader = (
    <div className={`rounded-full border-t-white border-white/20 animate-spin ${sizeClasses[size]}`} />
  );

  if (fullPage) {
    return (
      <div data-testid="loader" className="flex items-center justify-center min-h-[50vh] w-full bg-white/80 fixed inset-0 z-50">
        {loader}
      </div>
    );
  }

  return (
    <div data-testid="loader" className="flex items-center justify-center p-4">
      {loader}
    </div>
  );
}
