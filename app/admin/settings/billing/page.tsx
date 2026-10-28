'use client';

import { BentoCard } from '@/components/ui/BentoCard';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <BentoCard className="p-10 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <CreditCard size={28} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Billing not available yet</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            Subscription management and billing history are coming soon.
            You are on the free beta — no payment required right now.
          </p>
        </div>
      </BentoCard>
    </div>
  );
}
