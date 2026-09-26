import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, SessionUser } from '@/types/auth';

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  user: SessionUser | null;
  ecoleNom: string;
  ecoleLogo: string;
  setEcoleIdentite: (nom: string, logoUrl: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      ecoleNom: '',
      ecoleLogo: '',
      setSession: (session) => set({ session, user: session.user }),
      clearSession: () => set({ session: null, user: null, ecoleNom: '', ecoleLogo: '' }),
      setEcoleIdentite: (nom, logoUrl) => set({ ecoleNom: nom, ecoleLogo: logoUrl }),
    }),
    { name: 'noura-auth' }
  )
);
