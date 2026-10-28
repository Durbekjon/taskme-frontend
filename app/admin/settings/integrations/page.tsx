'use client';

import { BentoCard } from '@/components/ui/BentoCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2 } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'google', name: 'Google Calendar', desc: 'Two-way sync for all bookings and crew schedules.', icon: '📅', connected: false },
  { id: 'stripe', name: 'Stripe', desc: 'Accept credit card payments directly on your invoices.', icon: '💳', connected: false },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Send automated job alerts and reminders to crew.', icon: '💬', connected: false },
  { id: 'quickbooks', name: 'QuickBooks Online', desc: 'Automatically sync invoices and expenses for accounting.', icon: '📊', connected: false },
  { id: 'slack', name: 'Slack', desc: 'Get notifications for new bookings and paid invoices.', icon: '📱', connected: false },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <BentoCard className="p-6">
        <div className="max-w-2xl mb-8">
          <h2 className="text-lg font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">Connect Task.me with your favorite tools to automate workflows and keep data in sync.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {INTEGRATIONS.map((app) => (
             <div key={app.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all flex flex-col h-full bg-white">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shadow-sm">
                      {app.icon}
                   </div>
                   {app.connected && <Badge status="confirmed" label="Connected" dot={false} />}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
                <p className="text-xs text-gray-500 mb-6 flex-1">{app.desc}</p>
                
                {app.connected ? (
                   <GlassButton variant="ghost" size="sm" className="w-full" onClick={() => alert('Integration configuration coming soon.')}>Configure</GlassButton>
                ) : (
                   <GlassButton variant="primary" size="sm" className="w-full" onClick={() => alert(`${app.name} integration coming soon.`)}>Connect</GlassButton>
                )}
             </div>
           ))}
        </div>
      </BentoCard>
    </div>
  );
}
