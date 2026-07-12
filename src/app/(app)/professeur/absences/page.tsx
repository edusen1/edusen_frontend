'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
const B = '#e6ebf1';

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  APPROUVEE: { label: 'Approuvée', bg: '#dcfce7', color: '#16a34a' },
  REJETEE: { label: 'Rejetée', bg: '#fee2e2', color: '#dc2626' },
};

const TYPE_LABELS: Record<string, string> = {
  MALADIE: 'Maladie',
  CONGE: 'Congé',
  SANS_SOLDE: 'Sans solde',
  FORMATION: 'Formation',
  AUTRE: 'Autre',
};

type Absence = {
  id: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  typeAbsence: string;
  motif: string;
  statut: string;
  documentJustificatifUrl: string | null;
};

export default function EnseignantAbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', typeAbsence: '', motif: '' });
  const [justificatifFiles, setJustificatifFiles] = useState<File[]>([]);

  const fetchAbsences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/professeur/absences');
      const data = Array.isArray(res.data) ? res.data : ((res.data as R)?.data ?? (res.data as R)?.content ?? []);
      setAbsences((data as R[]).map((a) => ({
        id: String(a.id ?? ''),
        dateDebut: String(a.dateDebut ?? ''),
        dateFin: String(a.dateFin ?? ''),
        heureDebut: String(a.heureDebut ?? ''),
        heureFin: String(a.heureFin ?? ''),
        typeAbsence: String(a.typeAbsence ?? 'AUTRE'),
        motif: String(a.motif ?? ''),
        statut: String(a.statut ?? 'EN_ATTENTE'),
        documentJustificatifUrl: a.documentJustificatifUrl ? String(a.documentJustificatifUrl) : null,
      })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAbsences(); }, [fetchAbsences]);

  function openCreate() {
    setEditId(null);
    setForm({ dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', typeAbsence: '', motif: '' });
    setJustificatifFiles([]);
    setShowModal(true);
  }

  function openEdit(a: Absence) {
    if (a.statut !== 'EN_ATTENTE') { toast.error('Seules les demandes en attente peuvent être modifiées'); return; }
    setEditId(a.id);
    setForm({
      dateDebut: a.dateDebut ? a.dateDebut.slice(0, 10) : '',
      dateFin: a.dateFin ? a.dateFin.slice(0, 10) : '',
      heureDebut: a.heureDebut || '',
      heureFin: a.heureFin || '',
      typeAbsence: a.typeAbsence,
      motif: a.motif,
    });
    setJustificatifFiles([]);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.dateDebut || !form.typeAbsence || !form.motif) { toast.error('Remplissez les champs obligatoires'); return; }
    setSaving(true);
    try {
      // Upload new justificatifs if any
      const uploadedUrls: string[] = [];
      for (const file of justificatifFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await apiClient.post('/professeur/absences/justificatif', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = (uploadRes.data as R)?.justificatifUrl as string ?? (uploadRes.data as R)?.key as string;
        if (url) uploadedUrls.push(url);
      }
      const documentJustificatifUrl = uploadedUrls.length > 0 ? uploadedUrls.join(',') : undefined;

      if (editId) {
        await apiClient.patch(`/professeur/absences/${editId}`, { ...form, ...(documentJustificatifUrl ? { documentJustificatifUrl } : {}) });
        toast.success('Absence modifiée');
      } else {
        await apiClient.post('/professeur/absences', { ...form, documentJustificatifUrl });
        toast.success('Absence déclarée');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', typeAbsence: '', motif: '' });
      setJustificatifFiles([]);
      void fetchAbsences();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
    setSaving(false);
  }

  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return '—'; } };
  const nbApprouvees = absences.filter((a) => a.statut === 'APPROUVEE').length;
  const nbEnAttente = absences.filter((a) => a.statut === 'EN_ATTENTE').length;
  const nbRejetees = absences.filter((a) => a.statut === 'REJETEE').length;


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes absences</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{absences.length} déclaration(s)</div>
          <button onClick={openCreate} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Déclarer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
        {[
          { label: 'Total', count: absences.length, color: '#2563eb' },
          { label: 'Approuvées', count: nbApprouvees, color: '#16a34a' },
          { label: 'En attente', count: nbEnAttente, color: '#d97706' },
          { label: 'Rejetées', count: nbRejetees, color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 12px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : absences.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence déclarée</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {absences.map((a) => {
              const st = STATUT_MAP[a.statut] ?? STATUT_MAP.EN_ATTENTE;
              const heures = a.heureDebut && a.heureFin ? `${a.heureDebut} – ${a.heureFin}` : '';
              return (
                <div key={a.id} onClick={() => openEdit(a)}
                  style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 14px', cursor: a.statut === 'EN_ATTENTE' ? 'pointer' : 'default' }}
                  onMouseEnter={(e) => { if (a.statut === 'EN_ATTENTE') e.currentTarget.style.borderColor = '#2563eb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{f(a.dateDebut)}{a.dateFin !== a.dateDebut ? ` → ${f(a.dateFin)}` : ''}</span>
                    {heures && <span style={{ fontSize: 10, color: '#64748b' }}>{heures}</span>}
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>{TYPE_LABELS[a.typeAbsence] ?? a.typeAbsence}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 6px', background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{a.motif}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {a.documentJustificatifUrl && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                        {a.documentJustificatifUrl.split(',').map((url, fi) => (
                          <a key={fi} href={resolveStorageUrl(url.trim())} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
                            style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            Fichier {fi + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {!a.documentJustificatifUrl && <div style={{ flex: 1 }} />}
                    {a.statut === 'EN_ATTENTE' && (
                      <button onClick={(ev) => { ev.stopPropagation(); openEdit(a); }}
                        style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Modifier
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal déclaration */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${B}`, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{editId ? 'Modifier la demande' : 'Déclarer une absence'}</div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Date début *</label>
                  <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value, dateFin: f.dateFin || e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Date fin *</label>
                  <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Heure début</label>
                  <input type="time" value={form.heureDebut} onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Heure fin</label>
                  <input type="time" value={form.heureFin} onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Type d&apos;absence *</label>
                <select value={form.typeAbsence} onChange={(e) => setForm((f) => ({ ...f, typeAbsence: e.target.value }))}
                  style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Sélectionner...</option>
                  <option value="MALADIE">Maladie</option>
                  <option value="CONGE">Congé</option>
                  <option value="SANS_SOLDE">Sans solde</option>
                  <option value="FORMATION">Formation</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Motif / Raison *</label>
                <textarea value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} rows={3}
                  placeholder="Décrivez la raison de votre absence..."
                  style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Justificatifs (documents ou images)</label>
                <input id="absence-file-input" type="file" accept="image/*,.pdf,.doc,.docx" multiple onChange={(e) => setJustificatifFiles((prev) => [...prev, ...(e.target.files ? [...e.target.files] : [])])}
                  style={{ display: 'none' }} />
                <button type="button" onClick={() => document.getElementById('absence-file-input')?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: `2px dashed ${B}`, background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: '#475569', width: '100%' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <span style={{ fontSize: 11 }}>Joindre un justificatif (certificat, ordonnance...)</span>
                </button>
                {justificatifFiles.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {justificatifFiles.map((f, i) => (
                      <div key={i} style={{ fontSize: 10, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{f.name} ({(f.size / 1024).toFixed(0)} Ko)</span>
                        <button onClick={() => setJustificatifFiles((prev) => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10, padding: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => { setShowModal(false); setJustificatifFiles([]); }} style={{ height: 36, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleSubmit()} disabled={saving || !form.dateDebut || !form.typeAbsence || !form.motif}
                style={{ height: 36, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: !form.dateDebut || !form.typeAbsence || !form.motif ? 0.5 : 1 }}>
                {saving ? 'Envoi...' : editId ? 'Modifier' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
