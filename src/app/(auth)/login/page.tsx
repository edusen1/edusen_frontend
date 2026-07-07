'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/endpoints';
import { decodeJwt } from '@/lib/auth/decode';
import type { UserRole } from '@/types/auth';

const loginSchema = z.object({
  login: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setSession } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      const { accessToken, refreshToken } = res.data?.data ?? res.data;
      const payload = decodeJwt(accessToken);
      setSession({
        accessToken,
        refreshToken,
        expiresAt: ((payload.exp as number) ?? 0) * 1000,
        user: {
          id: (payload.sub as string) ?? '',
          nom: (payload.nom as string) ?? '',
          prenom: (payload.prenom as string) ?? '',
          email: (payload.email as string) ?? '',
          role: (payload.role as UserRole) ?? 'ADMIN',
          tenantId: (payload.tenantId as string) ?? '',
        },
      });
      toast.success('Connexion réussie');
      const role = payload.role as string;
      if (role === 'ELEVE') router.push('/eleve/accueil');
      else if (role === 'PARENT') router.push('/parent/enfants');
      else if (role === 'ENSEIGNANT') router.push('/professeur/mes-classes');
      else if (role === 'SUPER_ADMIN' || role === 'GESTIONNAIRE') router.push('/platform/stats');
      else router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Identifiants incorrects';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', height: '100vh', background: '#fff' }}>
      {/* Left panel — photo */}
      <div style={{ position: 'relative', background: '#0f172a' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80"
          alt="École"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,.2) 0%, rgba(15,23,42,.82) 100%)' }} />

        {/* Logo top-left */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: 40, height: 40, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-.02em' }}>NS</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Noura School</span>
        </div>

        {/* Tagline bottom-left */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '44px' }}>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-.02em', maxWidth: 380 }}>
            La gestion scolaire, simple et claire.
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 15, marginTop: 14, maxWidth: 360, lineHeight: 1.55 }}>
            Notes, bulletins, emplois du temps et présences — pour toute l&apos;école.
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Connexion</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 7 }}>Accédez à votre espace établissement.</div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 0 }}>
          {/* Email */}
          <div style={{ marginTop: 34 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 7 }}>
              Adresse e-mail ou téléphone
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${errors.login ? '#dc2626' : '#d9e0e8'}`, padding: '0 13px', height: 46, background: '#fff' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="1"/><path d="m22 7-10 5L2 7"/>
              </svg>
              <input
                {...register('login')}
                placeholder="prof.diallo@noura.sn"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
              />
            </div>
            {errors.login && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.login.message}</p>}
          </div>

          {/* Password */}
          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 7 }}>
              Mot de passe
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${errors.password ? '#dc2626' : '#d9e0e8'}`, padding: '0 13px', height: 46, background: '#fff' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent', letterSpacing: showPassword ? 'normal' : '.18em' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                {showPassword
                  ? <EyeOff size={17} color="#94a3b8" />
                  : <Eye size={17} color="#94a3b8" />
                }
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          {/* Remember me + Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
              <span style={{ width: 17, height: 17, border: '1px solid #cbd5e1', display: 'inline-block' }} />
              Se souvenir de moi
            </label>
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ marginTop: 26, height: 48, width: '100%', border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" />Connexion...</> : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Accès réservé au personnel et aux familles.
        </div>
      </div>
    </div>
  );
}
