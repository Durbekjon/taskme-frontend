/**
 * Re-export kept so existing imports keep working. The implementation now
 * lives in the shared provider - see `libs/user-context.tsx`.
 */
export { useUser, displayName, UserProvider } from '../user-context';
export type { AuthUser as User } from '@/types/api';
