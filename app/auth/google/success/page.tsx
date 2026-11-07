'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoPlay } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { decodeToken, landingPathForRoles, setToken } from '@/libs/session';
import { useUser } from '@/libs/user-context';

function GoogleSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useUser();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/?error=google_auth_failed');
      return;
    }

    // One token key for the whole app - see libs/session.ts.
    setToken(token);
    const claims = decodeToken(token);
    void refresh().finally(() => {
      router.replace(landingPathForRoles(claims?.roles));
    });
  }, [searchParams, router, refresh]);

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-12 flex items-center justify-center select-none">
      <div className="glass rounded-[2.5rem] p-10 border border-white/60 shadow-2xl text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mx-auto mb-4 shadow-md shadow-black/15">
          <VideoPlay color="#FFF" size={20} variant="Bold" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 size={18} className="animate-spin text-gray-900" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Signing you in...</h2>
        </div>
        <p className="text-xs text-gray-500 font-medium">Completing Google authentication</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-900" />
      </div>
    }>
      <GoogleSuccessHandler />
    </Suspense>
  );
}
