import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: { default: 'Creative Portal', template: '%s | Task.me Creative' },
};

export default function CreativeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="creative" searchPlaceholder="Search tasks, studios, or earnings...">{children}</AppShell>;
}
