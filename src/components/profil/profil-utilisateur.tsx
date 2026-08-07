'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-query-api';

/**
 * Écran « Mon profil » commun à tous les rôles.
 *
 * Chaque rôle avait sa propre copie de cet écran, à l'identique au libellé près.
 * Résultat : les rôles arrivés plus tard (caissier, comptable, sécurité) n'en
 * avaient aucune — le menu du caissier pointait vers `/caisse/profil`, page
 * inexistante, et renvoyait un 404. Un composant unique évite de recréer une
 * page à chaque nouveau rôle.
 */

type Tab = 'info' | 'securite';

const LIBELLES_ROLE: Record<string, string> = {
  ADMIN: 'Administration',
  GESTIONNAIRE: 'Gestion',
  ENSEIGNANT: 'Enseignant',
  SURVEILLANT: 'Surveillant',
  CAISSIER: 'Caisse',
  COMPTABLE: 'Comptabilité',
  SECURITE: 'Sécurité',
  ELEVE: 'Élève',
  PARENT: 'Parent',
  RH: 'Ressources Humaines',
};

export function ProfilUtilisateur() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const u = (user ?? {}) as Record<string, unknown>;
  const role = String(u.role ?? '');
  const libelleRole = LIBELLES_ROLE[role] ?? role ?? '—';

  const [tab, setTab] = useState<Tab>('info');
  const [infoForm, setInfoForm] = useState({
    // L'API renvoie firstName/lastName ; certains écrans historiques lisaient
    // prenom/nom. On accepte les deux pour ne pas afficher un formulaire vide.
    firstName: String(u.firstName ?? u.prenom ?? ''),
    lastName: String(u.lastName ?? u.nom ?? ''),
    email: String(u.email ?? ''),
    telephone: String(u.telephone ?? ''),
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdError, setPwdError] = useState('');

  const handleSaveInfo = async () => {
    await updateProfile.mutateAsync({
      firstName: infoForm.firstName,
      lastName: infoForm.lastName,
      email: infoForm.email,
      telephone: infoForm.telephone,
    });
  };

  const handleChangePwd = async () => {
    setPwdError('');
    if (!pwdForm.currentPassword || !pwdForm.newPassword) { setPwdError('Tous les champs sont requis'); return; }
    if (pwdForm.newPassword !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas'); return; }
    if (pwdForm.newPassword.length < 8) { setPwdError('Minimum 8 caractères'); return; }
    await changePassword.mutateAsync({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
    setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  const inp: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Informations' },
    { key: 'securite', label: 'Sécurité' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Mon profil</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{libelleRole}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', maxWidth: 880 }}>

          <div style={{ flex: '0 0 220px', minWidth: 180 }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, background: '#0f172a', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>
                {(infoForm.firstName[0] ?? '').toUpperCase()}{(infoForm.lastName[0] ?? '').toUpperCase()}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{infoForm.firstName} {infoForm.lastName}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{infoForm.email}</div>
              <div style={{ marginTop: 12, display: 'inline-block', padding: '4px 12px', background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700 }}>
                {libelleRole}
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e6ebf1', borderBottom: 'none', overflowX: 'auto' }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{ padding: '12px 20px', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#2563eb' : '#64748b', background: 'transparent', border: 'none', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24 }}>

              {tab === 'info' && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Informations personnelles</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <div>
                      <label style={lbl}>Prénom</label>
                      <input value={infoForm.firstName} onChange={(e) => setInfoForm((f) => ({ ...f, firstName: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Nom</label>
                      <input value={infoForm.lastName} onChange={(e) => setInfoForm((f) => ({ ...f, lastName: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Email</label>
                      <input type="email" value={infoForm.email} onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Téléphone</label>
                      <input value={infoForm.telephone} onChange={(e) => setInfoForm((f) => ({ ...f, telephone: e.target.value }))} style={inp} placeholder="+221 77 000 00 00" />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Rôle</label>
                    <div style={{ height: 40, border: '1px solid #e6ebf1', padding: '0 12px', fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', background: '#f8fafc' }}>
                      {libelleRole}
                    </div>
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSaveInfo}
                      disabled={updateProfile.isPending}
                      style={{ height: 40, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: updateProfile.isPending ? 0.7 : 1 }}
                    >
                      {updateProfile.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'securite' && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Changer le mot de passe</div>

                  {pwdError && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, padding: '10px 14px', marginBottom: 16 }}>
                      {pwdError}
                    </div>
                  )}

                  {(['current', 'next', 'confirm'] as const).map((key) => {
                    const labels = { current: 'Mot de passe actuel', next: 'Nouveau mot de passe', confirm: 'Confirmer le nouveau mot de passe' };
                    const fieldKey = key === 'current' ? 'currentPassword' : key === 'next' ? 'newPassword' : 'confirm';
                    return (
                      <div key={key} style={{ marginBottom: 14 }}>
                        <label style={lbl}>{labels[key]}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPwd[key] ? 'text' : 'password'}
                            value={pwdForm[fieldKey as keyof typeof pwdForm]}
                            onChange={(e) => setPwdForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
                            style={{ ...inp, paddingRight: 40 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd((s) => ({ ...s, [key]: !s[key] }))}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                          >
                            {showPwd[key] ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleChangePwd}
                      disabled={changePassword.isPending}
                      style={{ height: 40, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}
                    >
                      {changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
