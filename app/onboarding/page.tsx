'use client';

import { Suspense } from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
