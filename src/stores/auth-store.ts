import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, SessionUser } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  user: SessionUser | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      setSession: (session) => set({ session, user: session.user }),
      clearSession: () => set({ session: null, user: null }),
    }),
    { name: 'noura-auth' }
  )
);
