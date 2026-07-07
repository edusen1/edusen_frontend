'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-query-api';
import { useAuthStore } from '@/stores/auth-store';

const STATIC_ACTIVITES = [
  { id: 1, action: 'Appel effectué', detail: '3ème B — Mathématiques', date: '2026-06-28', heure: '08:05' },
  { id: 2, action: 'Notes saisies', detail: '4ème A — Mathématiques, 30 élèves', date: '2026-06-27', heure: '14:30' },
  { id: 3, action: 'Entrée cahier de textes', detail: '2nde C — Sciences Physiques', date: '2026-06-26', heure: '10:15' },
  { id: 4, action: 'Appel effectué', detail: '5ème C — Mathématiques', date: '2026-06-25', heure: '11:00' },
  { id: 5, action: 'Réclamation traitée', detail: 'Moussa Diallo — note corrigée', date: '2026-06-24', heure: '09:45' },
];

export default function ProfesseurProfilPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [form, setForm] = useState({
    prenom: user?.prenom ?? 'Mamadou',
    nom: user?.nom ?? 'Diallo',
    email: user?.email ?? 'mamadou.diallo@nouraschool.sn',
    telephone: (user as Record<string, unknown> | null)?.telephone as string ?? '77 123 45 67',
    matiere: 'Mathématiques',
    specialite: 'Algèbre et Géométrie',
  });

  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmer: '' });
  const [activeTab, setActiveTab] = useState<'infos' | 'securite' | 'activite'>('infos');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const initials = `${form.prenom[0] ?? ''}${form.nom[0] ?? ''}`.toUpperCase();

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(form);
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleChangePw = async () => {
    if (pwForm.nouveau !== pwForm.confirmer) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.actuel, newPassword: pwForm.nouveau });
      toast.success('Mot de passe modifié');
      setPwForm({ actuel: '', nouveau: '', confirmer: '' });
    } catch {
      toast.error('Erreur lors du changement');
    }
  };

  const handle2FA = () => {
    setTwoFAEnabled((v) => !v);
    toast.success(twoFAEnabled ? '2FA désactivé' : '2FA activé — configurez votre application authenticator');
  };

  const fd = (date: string, heure: string) =>
    `${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${heure}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon profil</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 20, maxWidth: 900, flexWrap: 'wrap' }}>
          {/* Left: avatar card */}
          <div style={{ width: 220, flexShrink: 0, minWidth: 180 }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 auto 14px' }}>
                {initials}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Professeur</div>
              <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>{form.matiere}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18, marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.04em' }}>Infos rapides</div>
              {[
                { label: 'Matière', value: form.matiere },
                { label: 'Spécialité', value: form.specialite },
                { label: 'Tél.', value: form.telephone },
              ].map((i) => (
                <div key={i.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{i.label}</div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, marginTop: 1 }}>{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tabs + form */}
          <div style={{ flex: '1 1 300px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e6ebf1', marginBottom: 16, overflowX: 'auto' }}>
              {[
                { key: 'infos', label: 'Informations' },
                { key: 'securite', label: 'Sécurité' },
                { key: 'activite', label: 'Activité' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as 'infos' | 'securite' | 'activite')}
                  style={{ flex: 1, height: 44, border: 'none', whiteSpace: 'nowrap', padding: '0 12px', background: activeTab === t.key ? '#eff6ff' : 'transparent', color: activeTab === t.key ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24 }}>
              {activeTab === 'infos' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                    {[
                      { label: 'Prénom', key: 'prenom' },
                      { label: 'Nom', key: 'nom' },
                      { label: 'Email', key: 'email' },
                      { label: 'Téléphone', key: 'telephone' },
                      { label: 'Matière principale', key: 'matiere' },
                      { label: 'Spécialité', key: 'specialite' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                        <input
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={updateProfile.isPending} style={{ height: 38, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: updateProfile.isPending ? 0.7 : 1 }}>
                      {updateProfile.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'securite' && (
                <>
                  {[
                    { label: 'Mot de passe actuel', key: 'actuel' },
                    { label: 'Nouveau mot de passe', key: 'nouveau' },
                    { label: 'Confirmer le nouveau', key: 'confirmer' },
                  ].map(({ label, key }) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                      <input
                        type="password"
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                        style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop: 4, marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleChangePw} disabled={changePassword.isPending} style={{ height: 38, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}>
                      {changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                    </button>
                  </div>

                  {/* 2FA */}
                  <div style={{ borderTop: '1px solid #eef2f6', paddingTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Authentification à deux facteurs (2FA)</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {twoFAEnabled ? 'Activée — votre compte est protégé.' : 'Désactivée — activez pour plus de sécurité.'}
                        </div>
                      </div>
                      <button
                        onClick={handle2FA}
                        style={{ height: 36, padding: '0 18px', border: twoFAEnabled ? '1px solid #fecaca' : 'none', background: twoFAEnabled ? '#fff' : '#2563eb', color: twoFAEnabled ? '#dc2626' : '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        {twoFAEnabled ? 'Désactiver 2FA' : 'Activer 2FA'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'activite' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Historique des activités récentes</div>
                  {STATIC_ACTIVITES.map((a, idx) => (
                    <div key={a.id} style={{ display: 'flex', gap: 14, paddingBottom: 16, marginBottom: 16, borderBottom: idx < STATIC_ACTIVITES.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                      <div style={{ width: 36, height: 36, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{a.action}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{a.detail}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{fd(a.date, a.heure)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
