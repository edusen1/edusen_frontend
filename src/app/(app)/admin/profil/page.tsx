'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

type TabKey = 'profil' | 'securite';

type UserInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string | null;
  matricule: string | null;
  photoUrl: string | null;
  role: string;
  username: string | null;
  genre: string | null;
  dateNaissance: string | null;
  adresse: string | null;
};

export default function AdminProfilPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [activeTab, setActiveTab] = useState<TabKey>('profil');
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', telephone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/auth/me');
      const d = res.data as UserInfo;
      setUserInfo(d);
      setPhotoUrl(d.photoUrl);
      setProfileForm({
        firstName: d.firstName ?? '',
        lastName: d.lastName ?? '',
        email: d.email ?? '',
        telephone: d.telephone ?? '',
      });
    } catch { /* fallback to store */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchMe(); }, [fetchMe]);

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
    if (pwForm.newPassword.length < 8) { toast.error('Mot de passe trop court (min. 8 caractères)'); return; }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Mot de passe modifié');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      toast.error('Mot de passe actuel incorrect');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 5 Mo)'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Format non supporté'); return; }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/v1/auth/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (res.data as Record<string, string>)?.photoUrl;
      if (url) setPhotoUrl(url);
      toast.success('Photo mise à jour');
    } catch { toast.error('Erreur lors de l\'upload'); }
    setUploadingPhoto(false);
  };

  const initials = `${(userInfo?.firstName ?? user?.prenom)?.[0] ?? ''}${(userInfo?.lastName ?? user?.nom)?.[0] ?? ''}`.toUpperCase() || 'U';
  const fullName = userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  const role = userInfo?.role ?? user?.role ?? '';

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
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ height: 42, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#2563eb' : '#64748b', borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        <div style={{ maxWidth: 620 }}>

          {loading && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>}

          {/* ── PROFIL ── */}
          {!loading && activeTab === 'profil' && (
            <div>
              {/* Avatar card */}
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Photo" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, borderRadius: '50%' }}>
                      {initials}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', border: '2px solid #fff', background: '#2563eb', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    title="Changer la photo"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{role}</div>
                  {userInfo?.matricule && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Matricule : {userInfo.matricule}</div>}
                  {userInfo?.username && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>@{userInfo.username}</div>}
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
          {!loading && activeTab === 'securite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>Le mot de passe doit contenir au moins 8 caractères.</div>
                </div>
                <button onClick={handleChangePw} disabled={changePassword.isPending} style={{ height: 40, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: changePassword.isPending ? 0.7 : 1 }}>
                  {changePassword.isPending ? 'Modification…' : 'Changer le mot de passe'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
