'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
const B = '#e6ebf1';

type TabKey = 'infos' | 'securite';

export default function EnseignantProfilPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<R>({});
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', telephone: '', specialite: '', adresse: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>('infos');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/professeur/profil');
      const p = (res.data ?? {}) as R;
      setProfile(p);
      setForm({
        firstName: String(p.firstName ?? ''),
        lastName: String(p.lastName ?? ''),
        email: String(p.email ?? ''),
        telephone: String(p.telephone ?? ''),
        specialite: String(p.specialite ?? ''),
        adresse: String(p.adresse ?? ''),
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.patch('/professeur/profil', form);
      toast.success('Profil mis à jour');
      void fetchProfile();
    } catch { toast.error('Erreur'); }
    setSaving(false);
  }

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

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/professeur/profil/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo mise à jour');
      void fetchProfile();
    } catch { toast.error('Erreur upload photo'); }
    setUploadingPhoto(false);
  }

  const photoUrl = resolveStorageUrl(profile.photoUrl as string);
  const initials = `${String(profile.firstName ?? '').charAt(0)}${String(profile.lastName ?? '').charAt(0)}`.toUpperCase() || 'EN';
  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Enseignant';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon profil</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* ── LEFT COLUMN : Photo + Infos rapides ── */}
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Photo card */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 26, fontWeight: 700 }}>
                    {initials}
                  </div>
                )}
                <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f); }} />
                <button onClick={() => document.getElementById('photo-upload')?.click()} disabled={uploadingPhoto}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Enseignant</div>
              {profile.specialite && <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>{String(profile.specialite)}</div>}
              {profile.username && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>@{String(profile.username)}</div>}
            </div>

            {/* Infos rapides */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.04em' }}>Informations</div>
              {[
                { label: 'Email', value: profile.email, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
                { label: 'Téléphone', value: profile.telephone, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg> },
                { label: 'Adresse', value: profile.adresse, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                { label: 'Spécialité', value: profile.specialite, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
              ].filter((i) => i.value).map((i) => (
                <div key={i.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{i.icon}</div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{i.label}</div>
                    <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, marginTop: 1, wordBreak: 'break-all' }}>{String(i.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN : Tabs + Forms ── */}
          <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#fff', border: `1px solid ${B}`, marginBottom: 12 }}>
              {([{ key: 'infos', label: 'Modifier les informations' }, { key: 'securite', label: 'Sécurité' }] as { key: TabKey; label: string }[]).map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ flex: 1, height: 44, border: 'none', background: tab === t.key ? '#eff6ff' : 'transparent', color: tab === t.key ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', whiteSpace: 'nowrap' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '24px' }}>
              {tab === 'infos' && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Informations personnelles</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {[
                      { label: 'Prénom', key: 'firstName' },
                      { label: 'Nom', key: 'lastName' },
                      { label: 'Email', key: 'email' },
                      { label: 'Téléphone', key: 'telephone' },
                      { label: 'Spécialité', key: 'specialite' },
                      { label: 'Adresse', key: 'adresse' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                        <input value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{ width: '100%', height: 40, border: `1px solid ${B}`, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => void handleSave()} disabled={saving}
                      style={{ height: 40, padding: '0 28px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </>
              )}

              {tab === 'securite' && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Changer le mot de passe</div>
                  <div style={{ maxWidth: 400 }}>
                    {[
                      { label: 'Mot de passe actuel', key: 'currentPassword' },
                      { label: 'Nouveau mot de passe', key: 'newPassword' },
                      { label: 'Confirmer le nouveau mot de passe', key: 'confirmPassword' },
                    ].map(({ label, key }) => (
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
