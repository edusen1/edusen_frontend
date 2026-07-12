'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api/client';
import type { UserRole } from '@/types/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) { toast.error('Remplissez tous les champs'); return; }
    if (form.newPassword.length < 8) { toast.error('Le mot de passe doit contenir au moins 8 caractères'); return; }
    if (form.newPassword !== form.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      await apiClient.post('/v1/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Mot de passe modifié avec succès');

      // Redirect to the right dashboard based on role
      const role = (user?.role ?? 'ADMIN') as UserRole;
      if (role === 'ELEVE') router.push('/eleve/accueil');
      else if (role === 'PARENT') router.push('/parent/enfants');
      else if (role === 'ENSEIGNANT') router.push('/professeur/dashboard');
      else if (role === 'CAISSIER' || role === 'COMPTABLE') router.push('/caisse/dashboard');
      else if (role === 'SURVEILLANT') router.push('/surveillant/dashboard');
      else if (role === 'RH') router.push('/rh/dashboard');
      else router.push('/admin/dashboard');
    } catch {
      toast.error('Mot de passe actuel incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 420, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 0' }}>
          <div style={{ width: 48, height: 48, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Changement de mot de passe</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>
            C&apos;est votre première connexion. Veuillez choisir un nouveau mot de passe pour sécuriser votre compte.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: '0 28px 28px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Mot de passe actuel</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d9e0e8', height: 44, background: '#fff' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Mot de passe fourni par l'administration"
                style={{ flex: 1, height: '100%', border: 'none', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer', color: '#94a3b8' }}>
                {showCurrent ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nouveau mot de passe</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d9e0e8', height: 44, background: '#fff' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="Minimum 8 caractères"
                style={{ flex: 1, height: '100%', border: 'none', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} style={{ background: 'none', border: 'none', padding: '0 10px', cursor: 'pointer', color: '#94a3b8' }}>
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
            {form.newPassword && form.newPassword.length < 8 && (
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Minimum 8 caractères</div>
            )}
          </div>

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
            disabled={loading}
            style={{ width: '100%', height: 44, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
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
