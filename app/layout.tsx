import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from '@/libs/user-context';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Task.me — Creative Studio Manager', template: '%s | Task.me' },
  description: 'Centralize and automate your creative studio workflows — bookings, crew scheduling, invoicing, and financial operations in one unified platform.',
  keywords: ['creative studio', 'production management', 'freelancer platform', 'crew scheduling', 'invoicing'],
  authors: [{ name: 'Task.me' }],
  creator: 'Task.me',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Task.me',
    title: 'Task.me — Creative Studio Manager',
    description: 'The all-in-one platform for creative studios, production houses, and freelancers.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F46E5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Every page calls toast.success/error, but no <Toaster> was ever
            mounted, so none of those messages could render. */}
        <UserProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </UserProvider>
      </body>
    </html>
  );
}
