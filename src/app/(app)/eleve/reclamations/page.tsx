'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  EN_COURS: { label: 'En cours', bg: '#dbeafe', color: '#2563eb' },
  TRAITEE: { label: 'Traitée', bg: '#dcfce7', color: '#16a34a' },
  RESOLU: { label: 'Traitée', bg: '#dcfce7', color: '#16a34a' },
  REJETEE: { label: 'Rejetée', bg: '#fee2e2', color: '#dc2626' },
};

export default function EleveReclamationsPage() {
  const [reclamations, setReclamations] = useState<R[]>([]);
  const [notesReclamables, setNotesReclamables] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ noteId: '', motif: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, nRes] = await Promise.all([
        apiClient.get('/eleve/reclamations').catch(() => ({ data: [] })),
        apiClient.get('/eleve/reclamations/notes').catch(() => ({ data: [] })),
      ]);
      const rd = rRes.data;
      setReclamations(Array.isArray(rd) ? rd : Array.isArray((rd as R)?.data) ? (rd as R).data as R[] : []);
      const nd = nRes.data;
      setNotesReclamables(Array.isArray(nd) ? nd : Array.isArray((nd as R)?.notes) ? (nd as R).notes as R[] : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleSubmit() {
    if (!form.noteId || !form.motif.trim()) { toast.error('Sélectionnez une note et décrivez le motif'); return; }
    setSaving(true);
    try {
      await apiClient.post('/eleve/reclamations', { noteId: form.noteId, motif: form.motif.trim() });
      toast.success('Réclamation envoyée');
      setShowForm(false);
      setForm({ noteId: '', motif: '' });
      void fetchData();
    } catch (err) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'); }
    setSaving(false);
  }

  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); } catch { return '—'; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Réclamations</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{reclamations.length}</div>
        <button onClick={() => setShowForm(true)} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Nouvelle</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {/* Form */}
        {showForm && (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '16px', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Nouvelle réclamation</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Note concernée *</label>
              <select value={form.noteId} onChange={(e) => setForm((f) => ({ ...f, noteId: e.target.value }))}
                style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Sélectionner une note...</option>
                {notesReclamables.map((n) => {
                  const mat = (n.matiere as R);
                  return <option key={String(n.id)} value={String(n.id)}>{String(mat?.libelle ?? '')} — {Number(n.note ?? n.valeur ?? 0)}/20 ({String(n.typeEvaluation ?? '')})</option>;
                })}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Motif *</label>
              <textarea value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} rows={3}
                placeholder="Décrivez pourquoi vous contestez cette note..."
                style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ height: 34, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleSubmit()} disabled={saving || !form.noteId || !form.motif.trim()}
                style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: !form.noteId || !form.motif.trim() ? 0.5 : 1 }}>
                {saving ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}

        {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : reclamations.length === 0 && !showForm ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune réclamation</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {reclamations.map((r) => {
              const st = STATUT_MAP[String(r.statut)] ?? STATUT_MAP.EN_ATTENTE;
              const mat = (r.note as R)?.matiere as R | undefined;
              return (
                <div key={String(r.id)} style={{ background: '#fff', border: `1px solid ${B}`, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{String(mat?.libelle ?? r.matiereNom ?? 'Note')}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: st.bg, color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>{f(String(r.createdAt ?? ''))}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{String(r.motif ?? '')}</div>
                  {r.reponse && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, padding: '4px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>Réponse : {String(r.reponse)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
