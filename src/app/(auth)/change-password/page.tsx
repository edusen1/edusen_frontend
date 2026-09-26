'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api/client';
import type { UserRole } from '@/types/auth';

const rules = [
  { key: 'length',  label: 'Au moins 8 caractères',      test: (p: string) => p.length >= 8 },
  { key: 'upper',   label: 'Une lettre majuscule',        test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'Une lettre minuscule',        test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit',   label: 'Un chiffre',                  test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'Un caractère spécial (@#$!…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const checks = rules.map((r) => ({ ...r, ok: r.test(form.newPassword) }));
  const isStrong = checks.every((c) => c.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.newPassword) { toast.error('Remplissez tous les champs'); return; }
    if (!isStrong) { toast.error('Le mot de passe ne respecte pas les critères de sécurité'); return; }
    if (form.newPassword !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      await apiClient.post('/v1/auth/change-password', {
        newPassword: form.newPassword,
      });
      toast.success('Mot de passe modifié avec succès');

      const role = (user?.role ?? 'ADMIN') as UserRole;
      if (role === 'ELEVE') router.push('/eleve/accueil');
      else if (role === 'PARENT') router.push('/parent/enfants');
      else if (role === 'ENSEIGNANT') router.push('/professeur/dashboard');
      else if (role === 'CAISSIER' || role === 'COMPTABLE') router.push('/caisse/dashboard');
      else if (role === 'SURVEILLANT') router.push('/surveillant/dashboard');
      else if (role === 'RH') router.push('/rh/dashboard');
      else router.push('/admin/dashboard');
    } catch {
      toast.error('Une erreur est survenue, veuillez réessayer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 420, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Edusen" width={132} height={44} style={{ display: 'block', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Changement de mot de passe</div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: '0 28px 28px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nouveau mot de passe</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d9e0e8', height: 44, background: '#fff' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="Choisissez un mot de passe sécurisé"
                style={{ flex: 1, height: '100%', border: 'none', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer', color: '#94a3b8', lineHeight: 0 }}>
                {showNew
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Critères de sécurité */}
          {form.newPassword && (
            <div style={{ marginBottom: 16 }}>
              {isStrong ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#16a34a' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  Mot de passe sécurisé
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {checks.filter((c) => !c.ok).map((c) => (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#dc2626' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Retapez le nouveau mot de passe"
              style={{ width: '100%', height: 44, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {form.confirm && form.newPassword !== form.confirm && (
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Les mots de passe ne correspondent pas</div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isStrong || form.newPassword !== form.confirm}
            style={{ width: '100%', height: 44, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (loading || !isStrong || form.newPassword !== form.confirm) ? 'not-allowed' : 'pointer', opacity: (loading || !isStrong || form.newPassword !== form.confirm) ? 0.5 : 1 }}
          >
            {loading ? 'Modification en cours...' : 'Changer le mot de passe'}
          </button>

          <button
            type="button"
            onClick={() => { clearSession(); router.push('/login'); }}
            style={{ width: '100%', height: 36, border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', marginTop: 12 }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
