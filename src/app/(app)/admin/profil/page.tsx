'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-query-api';

type TabKey = 'profil' | 'securite' | 'activite';

const STATIC_ACTIVITES = [
  { id: 'a1', action: 'Connexion', detail: 'Connexion depuis Dakar, Sénégal', date: '29/06/2026 08:14', type: 'connexion' },
  { id: 'a2', action: 'Modification profil', detail: 'Téléphone mis à jour', date: '28/06/2026 15:32', type: 'modification' },
  { id: 'a3', action: 'Connexion', detail: 'Connexion depuis Dakar, Sénégal', date: '27/06/2026 09:01', type: 'connexion' },
  { id: 'a4', action: 'Changement mot de passe', detail: 'Mot de passe modifié avec succès', date: '25/06/2026 11:20', type: 'securite' },
  { id: 'a5', action: 'Connexion', detail: 'Connexion depuis Thiès, Sénégal', date: '24/06/2026 08:45', type: 'connexion' },
  { id: 'a6', action: 'Création élève', detail: 'Élève Awa Ndiaye (NS-2026-0412) créé', date: '23/06/2026 14:12', type: 'action' },
  { id: 'a7', action: 'Génération bulletins', detail: 'Bulletins 3ème B — T2 générés (42 élèves)', date: '20/06/2026 10:55', type: 'action' },
];

const ACTIVITE_ICONS: Record<string, { bg: string; color: string; icon: string }> = {
  connexion: { bg: '#eff6ff', color: '#2563eb', icon: '🔑' },
  modification: { bg: '#fef3c7', color: '#d97706', icon: '✏️' },
  securite: { bg: '#fee2e2', color: '#dc2626', icon: '🔒' },
  action: { bg: '#f0fdf4', color: '#16a34a', icon: '⚡' },
};

export default function AdminProfilPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [activeTab, setActiveTab] = useState<TabKey>('profil');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.prenom ?? '',
    lastName: user?.nom ?? '',
    email: user?.email ?? '',
    telephone: '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const handleSaveProfil = async () => {
    try {
      await updateProfile.mutateAsync(profileForm);
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleChangePw = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Remplissez tous les champs'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mot de passe trop court (min. 6 caractères)'); return; }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Mot de passe modifié');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      toast.error('Mot de passe actuel incorrect');
    }
  };

  const handleToggle2FA = () => {
    setTwoFAEnabled((v) => !v);
    toast.success(twoFAEnabled ? '2FA désactivé' : '2FA activé — configurez votre application d\'authentification');
  };

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase() || 'AD';
  const fullName = user ? `${user.prenom} ${user.nom}` : 'Administrateur';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon profil</div>
        </div>
        <div style={{ display: 'flex', padding: '0 28px', borderTop: '1px solid #e6ebf1' }}>
          {([
            { key: 'profil', label: 'Informations' },
            { key: 'securite', label: 'Sécurité' },
            { key: 'activite', label: 'Activité' },
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ height: 42, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#2563eb' : '#64748b', borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: 620 }}>

          {/* ── PROFIL ── */}
          {activeTab === 'profil' && (
            <div>
              {/* Avatar card */}
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{user?.role ?? 'ADMIN'}</div>
                  {user?.tenantId && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Tenant: {user.tenantId}</div>}
                </div>
              </div>

              {/* Form */}
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Modifier mes informations</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Prénom</label>
                    <input value={profileForm.firstName} onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom</label>
                    <input value={profileForm.lastName} onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Adresse e-mail</label>
                  <input type="email" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Téléphone</label>
                  <input value={profileForm.telephone} onChange={(e) => setProfileForm((f) => ({ ...f, telephone: e.target.value }))} placeholder="+221 77 000 00 00" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={handleSaveProfil} disabled={updateProfile.isPending} style={{ height: 40, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: updateProfile.isPending ? 0.7 : 1 }}>
                  {updateProfile.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          )}

          {/* ── SÉCURITÉ ── */}
          {activeTab === 'securite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Mot de passe */}
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '24px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Changer le mot de passe</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Mot de passe actuel</label>
                  <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nouveau mot de passe</label>
                  <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Confirmer le nouveau mot de passe</label>
                  <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px 14px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>Le mot de passe doit contenir au moins 6 caractères.</div>
                </div>
                <button onClick={handleChangePw} disabled={changePassword.isPending} style={{ height: 40, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}>
                  {changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                </button>
              </div>

              {/* 2FA */}
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Authentification à deux facteurs (2FA)</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {twoFAEnabled ? '✅ 2FA activé — votre compte est sécurisé' : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
                    </div>
                  </div>
                  <div style={{ width: 48, height: 26, background: twoFAEnabled ? '#2563eb' : '#d9e0e8', borderRadius: 13, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }} onClick={handleToggle2FA}>
                    <div style={{ position: 'absolute', top: 3, left: twoFAEnabled ? 25 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </div>
                </div>
                {twoFAEnabled && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#1d4ed8' }}>
                      🔑 Configurez votre application d'authentification (Google Authenticator, Authy) avec le QR code fourni par email.
                    </div>
                  </div>
                )}
                <button
                  onClick={handleToggle2FA}
                  style={{ marginTop: 16, height: 38, padding: '0 20px', border: `1px solid ${twoFAEnabled ? '#fecaca' : '#2563eb'}`, background: twoFAEnabled ? '#fff' : '#2563eb', color: twoFAEnabled ? '#dc2626' : '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  {twoFAEnabled ? 'Désactiver la 2FA' : 'Activer la 2FA'}
                </button>
              </div>
            </div>
          )}

          {/* ── ACTIVITÉ ── */}
          {activeTab === 'activite' && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Historique d'activité</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>7 dernières actions</div>
              </div>
              <div>
                {STATIC_ACTIVITES.map((a, idx) => {
                  const style = ACTIVITE_ICONS[a.type] ?? ACTIVITE_ICONS.action;
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: idx < STATIC_ACTIVITES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: 36, height: 36, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                        {style.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{a.action}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{a.detail}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
