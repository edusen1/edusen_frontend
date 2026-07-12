'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';

type Message = { id: string; titre: string; contenu: string; classeId: string; classeNom: string; statut: string; nbDestinataires: number; dateEnvoi: string; createdAt: string };
type ClasseItem = { id: string; nom: string };

const STATUT_COLORS: Record<string, { label: string; bg: string; color: string }> = {
  ENVOYE: { label: 'Envoyé', bg: '#dcfce7', color: '#16a34a' },
  BROUILLON: { label: 'Brouillon', bg: '#f1f5f9', color: '#64748b' },
  PLANIFIE: { label: 'Planifié', bg: '#fef3c7', color: '#d97706' },
  ECHEC: { label: 'Échec', bg: '#fee2e2', color: '#dc2626' },
};

export default function EnseignantCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [classes, setClasses] = useState<ClasseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre: '', contenu: '', classeId: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [commRes, classesRes] = await Promise.all([
        apiClient.get('/professeur/communications').catch(() => ({ data: [] })),
        apiClient.get('/professeur/mes-classes').catch(() => ({ data: [] })),
      ]);
      const commData = Array.isArray(commRes.data) ? commRes.data : [];
      setMessages(commData.map((c: R) => ({
        id: String(c.id ?? ''), titre: String(c.titre ?? ''), contenu: String(c.contenu ?? ''),
        classeId: String(c.classeId ?? ''), classeNom: String(c.classeLabel ?? c.classeNom ?? ''),
        statut: String(c.statut ?? 'ENVOYE'), nbDestinataires: Number(c.nbDestinataires ?? 0),
        dateEnvoi: String(c.dateEnvoi ?? c.createdAt ?? ''), createdAt: String(c.createdAt ?? ''),
      })));
      const clData = Array.isArray(classesRes.data) ? classesRes.data : ((classesRes.data as R)?.data ?? (classesRes.data as R)?.content ?? []);
      const clMap = new Map<string, string>();
      for (const item of clData as R[]) {
        const cl = (item.classe ?? item) as R;
        const cid = String(item.classeId ?? cl.id ?? item.id ?? '');
        const nom = String(cl.nom ?? item.nom ?? '');
        if (cid && nom && !clMap.has(cid)) clMap.set(cid, nom);
      }
      setClasses([...clMap.entries()].map(([id, nom]) => ({ id, nom })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleSend() {
    if (!form.titre.trim() || !form.contenu.trim() || !form.classeId) { toast.error('Remplissez tous les champs'); return; }
    setSaving(true);
    try {
      await apiClient.post('/professeur/communications', form);
      toast.success('Notification envoyée aux élèves');
      setShowForm(false);
      setForm({ titre: '', contenu: '', classeId: '' });
      void fetchData();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
    setSaving(false);
  }

  const f = (v: string) => { try { return new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };

  // Resolve classe name for messages
  const classeMap = new Map(classes.map((c) => [c.id, c.nom]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Communication</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{messages.length} message(s)</div>
          <button onClick={() => { setForm({ titre: '', contenu: '', classeId: '' }); setShowForm(true); }} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Notifier les élèves
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : (
          <>
            {/* Form */}
            {showForm && (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '16px', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Envoyer une notification</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Classe destinataire *</label>
                  <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value }))}
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                    <option value="">Sélectionner une classe...</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Titre *</label>
                  <input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex: Devoir à rendre pour lundi"
                    style={{ width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Message *</label>
                  <textarea value={form.contenu} onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))} rows={4}
                    placeholder="Rédigez votre message aux élèves..."
                    style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowForm(false)} style={{ height: 36, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => void handleSend()} disabled={saving || !form.titre.trim() || !form.contenu.trim() || !form.classeId}
                    style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: !form.titre.trim() || !form.contenu.trim() || !form.classeId ? 0.5 : 1 }}>
                    {saving ? 'Envoi...' : 'Envoyer la notification'}
                  </button>
                </div>
              </div>
            )}

            {/* Messages list */}
            {messages.length === 0 && !showForm ? (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune communication envoyée</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {messages.map((m) => {
                  const st = STATUT_COLORS[m.statut] ?? STATUT_COLORS.ENVOYE;
                  const clNom = m.classeNom || classeMap.get(m.classeId) || '—';
                  return (
                    <div key={m.id} style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flex: '1 1 200px' }}>{m.titre}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', border: '1px solid #ddd6fe' }}>{clNom}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 6 }}>{m.contenu}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8' }}>
                        <span>{f(m.dateEnvoi)}</span>
                        <span>{m.nbDestinataires} destinataire(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
