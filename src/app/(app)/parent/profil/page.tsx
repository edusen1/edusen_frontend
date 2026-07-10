'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUpdateProfile, useChangePassword, useParentProfil } from '@/hooks/use-query-api';
import { useAuthStore } from '@/stores/auth-store';

export default function ParentProfilPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { data: profilData } = useParentProfil();

  const [form, setForm] = useState({
    prenom: user?.prenom ?? '',
    nom: user?.nom ?? '',
    email: user?.email ?? '',
    telephone: (user as Record<string, unknown> | null)?.telephone as string ?? '',
    adresse: '',
    profession: '',
  });

  useEffect(() => {
    if (profilData) {
      const p = profilData as Record<string, unknown>;
      setForm((f) => ({
        prenom: (p.prenom ?? f.prenom) as string,
        nom: (p.nom ?? f.nom) as string,
        email: (p.email ?? f.email) as string,
        telephone: (p.telephone ?? f.telephone) as string,
        adresse: (p.adresse ?? '') as string,
        profession: (p.profession ?? '') as string,
      }));
    }
  }, [profilData]);

  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmer: '' });
  const [activeTab, setActiveTab] = useState<'infos' | 'securite'>('infos');

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#2563eb', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Mon profil</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 20, maxWidth: 860, flexWrap: 'wrap' }}>
          {/* Left: avatar card */}
          <div style={{ width: 220, flexShrink: 0, minWidth: 180 }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 auto 14px' }}>
                {initials}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{form.prenom} {form.nom}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Parent / Tuteur</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.04em' }}>Contacts</div>
              {[
                { label: 'Email', value: form.email },
                { label: 'Téléphone', value: form.telephone },
                { label: 'Adresse', value: form.adresse },
              ].map((i) => (
                <div key={i.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{i.label}</div>
                  <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, marginTop: 1 }}>{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tabs + form */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e6ebf1', marginBottom: 16, overflowX: 'auto' }}>
              {[
                { key: 'infos', label: 'Informations personnelles' },
                { key: 'securite', label: 'Sécurité' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as 'infos' | 'securite')}
                  style={{ flex: 1, height: 44, border: 'none', background: activeTab === t.key ? '#eff6ff' : 'transparent', color: activeTab === t.key ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent' }}
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
                      { label: 'Adresse', key: 'adresse' },
                      { label: 'Profession', key: 'profession' },
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
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleChangePw} disabled={changePassword.isPending} style={{ height: 38, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}>
                      {changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
