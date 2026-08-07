'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile, useChangePassword } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

type TabKey = 'profil' | 'securite' | 'signature';

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

  const sigCanvasRef = useRef<HTMLCanvasElement>(null);

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
            { key: 'securite', label: 'Securite' },
            ...(['ADMIN', 'CAISSIER'].includes(role) ? [{ key: 'signature' as TabKey, label: 'Signature' }] : []),
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

          {/* ── SIGNATURE ── */}
          {!loading && activeTab === 'signature' && <SignatureTab />}

          {/* ── SECURITE ── */}
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

// ─── Signature Tab ───────────────────────────────────────────────────────────

function SignatureTab() {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'view' | 'draw' | 'upload'>('view');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/admin/signature').then((res) => {
      setSignatureUrl((res.data as { signatureUrl: string | null }).signatureUrl);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Canvas drawing
  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 200;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const onEnd = () => { isDrawingRef.current = false; };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd);

    return () => {
      canvas.removeEventListener('mousedown', onStart);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('mouseleave', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onEnd);
    };
  }, [mode]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function saveDrawnSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSaving(true);
    try {
      const res = await apiClient.post('/admin/signature', { signatureUrl: dataUrl });
      const url = (res.data as { signatureUrl: string }).signatureUrl;
      setSignatureUrl(url);
      setMode('view');
      toast.success('Signature enregistree');
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setSaving(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { toast.error('Fichier trop volumineux (max 1 Mo)'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Format non supporte (JPEG, PNG, WebP)'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/admin/signature', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (res.data as { signatureUrl: string }).signatureUrl;
      setSignatureUrl(url);
      setMode('view');
      toast.success('Signature enregistree');
    } catch { toast.error('Erreur lors de l\'upload'); }
    setSaving(false);
  }

  async function deleteSignature() {
    if (!confirm('Supprimer votre signature ?')) return;
    try {
      await apiClient.delete('/admin/signature', { headers: { 'Content-Type': undefined } });
      setSignatureUrl(null);
      toast.success('Signature supprimee');
    } catch { toast.error('Erreur'); }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Info */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', fontSize: 12, color: '#1e40af', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Votre signature apparaitra sur les documents generes (bulletins pour les administrateurs, recus de paiement pour les caissiers). Vous pouvez la dessiner directement ou importer une photo.</span>
      </div>

      {/* Current signature */}
      <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Ma signature</div>

        {mode === 'view' && (
          <>
            {signatureUrl ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signatureUrl} alt="Signature" style={{ maxWidth: 300, maxHeight: 120, objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>Cette signature sera apposee sur vos documents</div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px dashed #d9e0e8', padding: 40, textAlign: 'center', marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: 8 }}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Aucune signature enregistree</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMode('draw')} style={{ height: 38, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                Dessiner
              </button>
              <button onClick={() => fileRef.current?.click()} style={{ height: 38, padding: '0 16px', border: '1px solid #e6ebf1', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Importer une photo
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
              {signatureUrl && (
                <button onClick={deleteSignature} style={{ height: 38, padding: '0 16px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginLeft: 'auto' }}>
                  Supprimer
                </button>
              )}
            </div>
          </>
        )}

        {mode === 'draw' && (
          <>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Dessinez votre signature dans le cadre ci-dessous</div>
            <div style={{ border: '1px solid #e6ebf1', marginBottom: 12, background: '#fff' }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 200, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={clearCanvas} style={{ height: 38, padding: '0 16px', border: '1px solid #e6ebf1', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Effacer
              </button>
              <button onClick={() => setMode('view')} style={{ height: 38, padding: '0 16px', border: '1px solid #e6ebf1', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => void saveDrawnSignature()} disabled={saving} style={{ height: 38, padding: '0 16px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', marginLeft: 'auto', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Sauvegarde...' : 'Enregistrer la signature'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
