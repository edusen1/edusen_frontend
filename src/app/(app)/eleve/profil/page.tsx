'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
const B = '#e6ebf1';

type TabKey = 'infos' | 'securite';

export default function EleveProfilPage() {
  const [profile, setProfile] = useState<R>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('infos');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try { const res = await apiClient.get('/eleve/profil'); setProfile((res.data ?? {}) as R); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  async function handleChangePw() {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Minimum 6 caractères'); return; }
    setSavingPw(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Mot de passe modifié');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Erreur — vérifiez le mot de passe actuel'); }
    setSavingPw(false);
  }

  const photoUrl = resolveStorageUrl(profile.photoUrl as string);
  const initials = `${String(profile.firstName ?? '').charAt(0)}${String(profile.lastName ?? '').charAt(0)}`.toUpperCase() || 'EL';
  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Élève';
  const classeNom = String((profile.classe as R)?.nom ?? '');
  const matricule = String(profile.matricule ?? '');

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  const infos = [
    { label: 'Matricule', value: matricule },
    { label: 'Classe', value: classeNom },
    { label: 'Date de naissance', value: profile.dateNaissance ? new Date(String(profile.dateNaissance)).toLocaleDateString('fr-FR') : '' },
    { label: 'Lieu de naissance', value: profile.lieuNaissance },
    { label: 'Genre', value: profile.genre === 'MASCULIN' ? 'Masculin' : profile.genre === 'FEMININ' ? 'Féminin' : '' },
    { label: 'Adresse', value: profile.adresse },
    { label: 'Email', value: profile.email },
    { label: 'Téléphone', value: profile.telephone },
    { label: 'N° urgence', value: profile.numeroUrgence },
  ].filter((i) => i.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon profil</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Left */}
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '24px 20px', textAlign: 'center' }}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', display: 'block' }} />
              ) : (
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 700, margin: '0 auto 14px' }}>{initials}</div>
              )}
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
              {classeNom && <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>{classeNom}</div>}
              {matricule && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{matricule}</div>}
            </div>
          </div>

          {/* Right */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            <div style={{ display: 'flex', background: '#fff', border: `1px solid ${B}`, marginBottom: 12 }}>
              {([{ key: 'infos', label: 'Informations' }, { key: 'securite', label: 'Sécurité' }] as { key: TabKey; label: string }[]).map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flex: 1, height: 44, border: 'none', background: tab === t.key ? '#eff6ff' : 'transparent', color: tab === t.key ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '20px' }}>
              {tab === 'infos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {infos.map((i) => (
                    <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid #f1f5f9` }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{i.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{String(i.value)}</span>
                    </div>
                  ))}
                  {infos.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune information</div>}
                </div>
              )}
              {tab === 'securite' && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Changer le mot de passe</div>
                  <div style={{ maxWidth: 400 }}>
                    {[{ label: 'Mot de passe actuel', key: 'currentPassword' }, { label: 'Nouveau mot de passe', key: 'newPassword' }, { label: 'Confirmer', key: 'confirmPassword' }].map(({ label, key }) => (
                      <div key={key} style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                        <input type="password" value={pwForm[key as keyof typeof pwForm]} onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{ width: '100%', height: 40, border: `1px solid ${B}`, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <button onClick={() => void handleChangePw()} disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
                      style={{ height: 40, padding: '0 28px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingPw || !pwForm.currentPassword || !pwForm.newPassword ? 0.5 : 1 }}>
                      {savingPw ? 'Modification...' : 'Changer le mot de passe'}
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
