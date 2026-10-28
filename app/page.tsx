'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { VideoPlay, Sms, Lock, Eye, EyeSlash, InfoCircle } from 'iconsax-react';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { landingPathForRoles, setToken } from '@/libs/session';
import { useUser } from '@/libs/user-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // Derived from the URL rather than copied into state by an effect.
  const urlError = {
    session_expired: 'Your session has expired. Please sign in again.',
    google_auth_failed: 'Google sign-in failed. Please try again.',
  }[searchParams.get('error') ?? ''];

  const error = submitError || urlError || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsLoading(true);

    try {
      // The API returns { access_token, user }. This used to read
      // `data.user.role` and `data.refresh_token`, neither of which the
      // endpoint has ever returned - the resulting TypeError was swallowed by
      // the catch below and shown as "check your credentials".
      const { access_token, user } = await authApi.login({ email, password });
      setToken(access_token);
      await refresh();
      router.replace(landingPathForRoles(user.roles));
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-12 flex items-center justify-center relative select-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Main Glass Card matching Dashboard / AppShell */}
        <div className="glass rounded-[2.5rem] p-8 sm:p-10 border border-white/60 shadow-2xl relative overflow-hidden">
          {/* Studio Brand Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mx-auto mb-3 shadow-md shadow-black/15">
              <VideoPlay color="#FFF" size={20} variant="Bold" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task.me</h1>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
              Production Studio Workspace
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-2xl bg-red-50/90 border border-red-200/80 text-red-600 text-xs font-medium flex items-center gap-2"
            >
              <InfoCircle size={16} className="shrink-0" variant="Bold" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative group">
                <Sms
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors"
                  variant="Linear"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taskme.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/80 hover:bg-white focus:bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-400 shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative group">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors"
                  variant="Linear"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-white/80 hover:bg-white focus:bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-gray-400 shadow-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-black hover:bg-gray-900 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-150 shadow-md hover:shadow-lg shadow-black/10 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Symmetrical Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-black/5" />
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider">OR</span>
            <div className="flex-1 h-px bg-black/5" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-full bg-white/90 hover:bg-white active:scale-[0.98] border border-gray-200 hover:border-gray-300 text-gray-800 text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-center text-[11px] text-gray-400 mt-6 font-medium">
            Production Studio Management System · <span className="text-gray-500">v1.0</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static rendering at build time.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-900" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
