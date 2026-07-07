'use client';

import { useState } from 'react';
import { useEleveProfil, useChangePassword } from '@/hooks/use-query-api';
import { useAuthStore } from '@/stores/auth-store';

export default function EleveProfilPage() {
  const { data } = useEleveProfil();
  const { session } = useAuthStore();
  const user = session?.user;
  const changePassword = useChangePassword();

  const [activeTab, setActiveTab] = useState<'profil' | 'securite'>('profil');
  const [showPwd, setShowPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const profil = (data ?? {}) as Record<string, unknown>;
  const classeObj = profil.classe as Record<string, unknown> | undefined;
  const classeNom = (classeObj?.nom ?? '3ᵉ B') as string;
  const nomComplet = ((user?.prenom ?? '') + ' ' + (user?.nom ?? '')).trim() || 'Élève';
  const initials = ((user?.prenom?.[0] ?? '') + (user?.nom?.[0] ?? '')).toUpperCase() || 'E';

  const handleChangePwd = async () => {
    if (newPwd !== confirmPwd) return;
    await changePassword.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Tabs header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px' }}>
          {(['profil', 'securite'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '14px 0', fontSize: 13, fontWeight: activeTab === tab ? 600 : 500, color: activeTab === tab ? '#2563eb' : '#94a3b8', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {tab === 'profil' ? 'Profil' : 'Sécurité'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'profil' ? (
          <>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 60, height: 60, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{nomComplet}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Élève · {classeNom}</div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Nom complet', value: nomComplet },
                { label: 'Téléphone', value: (profil.telephone as string) ?? '77 000 00 00' },
                { label: 'Email', value: (profil.email as string) ?? user?.email ?? '—' },
                { label: 'Classe', value: classeNom },
              ].map((field) => (
                <div key={field.label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{field.label}</div>
                  <div style={{ height: 42, border: '1px solid #d9e0e8', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, color: '#0f172a' }}>{field.value}</div>
                </div>
              ))}
            </div>

            {profil.matricule && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Matricule</div>
                <div style={{ height: 42, border: '1px solid #d9e0e8', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, color: '#0f172a' }}>{profil.matricule as string}</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Changer le mot de passe</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Actuel', val: currentPwd, set: setCurrentPwd, type: showPwd ? 'text' : 'password' },
                { label: 'Nouveau', val: newPwd, set: setNewPwd, type: 'password' },
                { label: 'Confirmer', val: confirmPwd, set: setConfirmPwd, type: 'password' },
              ].map((f) => (
                <div key={f.label}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{f.label}</div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={f.type}
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder="••••••••"
                      style={{ height: 42, width: '100%', border: '1px solid #d9e0e8', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {f.label === 'Actuel' && (
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                      >
                        {showPwd ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleChangePwd}
              disabled={!currentPwd || !newPwd || !confirmPwd || changePassword.isPending}
              style={{ height: 42, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: (!currentPwd || !newPwd || !confirmPwd) ? 0.5 : 1 }}
            >
              {changePassword.isPending ? 'Modification…' : 'Enregistrer'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
