'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ABSENT: { label: 'Absent', bg: '#fee2e2', color: '#dc2626' },
  RETARD: { label: 'Retard', bg: '#fef3c7', color: '#d97706' },
};
const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  JUSTIFIEE: { label: 'Justifiée', bg: '#dcfce7', color: '#16a34a' },
  NON_JUSTIFIEE: { label: 'Non justifiée', bg: '#fee2e2', color: '#dc2626' },
};

export default function EleveAbsencesPage() {
  const [absences, setAbsences] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [justifId, setJustifId] = useState<string | null>(null);
  const [justifMotif, setJustifMotif] = useState('');
  const [justifFile, setJustifFile] = useState<File | null>(null);
  const [justifSaving, setJustifSaving] = useState(false);

  const fetchAbsences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/eleve/absences');
      const d = res.data;
      setAbsences(Array.isArray(d) ? d : Array.isArray((d as R)?.absences) ? (d as R).absences as R[] : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAbsences(); }, [fetchAbsences]);

  const total = absences.length;
  const retards = absences.filter((a) => String(a.typeAbsence) === 'RETARD').length;
  const justifiees = absences.filter((a) => a.justifiee || String(a.statut) === 'JUSTIFIEE').length;
  const nonJust = total - justifiees;

  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); } catch { return '—'; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes absences</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Total', value: total, color: '#0f172a' },
            { label: 'Retards', value: retards, color: '#d97706' },
            { label: 'Justifiées', value: justifiees, color: '#16a34a' },
            { label: 'Non justifiées', value: nonJust, color: '#dc2626' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : absences.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune absence enregistrée</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {absences.map((a, i) => {
              const type = TYPE_MAP[String(a.typeAbsence)] ?? TYPE_MAP.ABSENT;
              const statut = STATUT_MAP[String(a.statut)] ?? (a.justifiee ? STATUT_MAP.JUSTIFIEE : STATUT_MAP.NON_JUSTIFIEE);
              return (
                <div key={String(a.id ?? i)} style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{f(String(a.date ?? a.dateAbsence ?? a.createdAt ?? ''))}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: type.bg, color: type.color }}>{type.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: statut.bg, color: statut.color }}>{statut.label}</span>
                    {a.motif && <span style={{ flex: 1, fontSize: 11, color: '#64748b' }}>{String(a.motif)}</span>}
                    {String(a.statut) === 'NON_JUSTIFIEE' && !a.justifiee && (
                      <button onClick={() => { setJustifId(String(a.id)); setJustifMotif(''); setJustifFile(null); }}
                        style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Justifier
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal justification */}
      {justifId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${B}`, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Justifier mon absence</div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Motif *</label>
                <textarea value={justifMotif} onChange={(e) => setJustifMotif(e.target.value)} rows={3} placeholder="Expliquez la raison de votre absence..."
                  style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Document justificatif</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setJustifFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
                {justifFile && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>{justifFile.name}</div>}
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setJustifId(null)} style={{ height: 34, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button disabled={justifSaving || !justifMotif.trim()} onClick={async () => {
                setJustifSaving(true);
                try {
                  let docUrl: string | undefined;
                  if (justifFile) {
                    const fd = new FormData(); fd.append('file', justifFile);
                    const upRes = await apiClient.post('/eleve/reclamations/upload-justificatif', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    docUrl = String((upRes.data as R)?.url ?? (upRes.data as R)?.key ?? '');
                  }
                  // Use the absence endpoint to submit justification
                  await apiClient.post('/eleve/absences/justifier', { absenceId: justifId, motif: justifMotif.trim(), documentUrl: docUrl });
                  toast.success('Justification envoyée');
                  setJustifId(null);
                  void fetchAbsences();
                } catch { toast.error('Erreur — contactez l\'administration'); }
                setJustifSaving(false);
              }} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: !justifMotif.trim() ? 0.5 : 1 }}>
                {justifSaving ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
