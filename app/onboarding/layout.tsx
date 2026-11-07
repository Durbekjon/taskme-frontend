import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding | Task.me',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-12 flex items-center justify-center">
      <div className="w-full max-w-4xl glass rounded-[2.5rem] overflow-hidden relative border border-white/40 shadow-2xl min-h-[600px] flex">
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
