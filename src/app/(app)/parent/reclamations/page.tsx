'use client';

import { useState } from 'react';
import { useParentReclamations, useCreerReclamationParent } from '@/hooks/use-query-api';

const STATIC_RECLAMATIONS = [
  { id: 'r1', sujet: 'Note contestée — Mathématiques T1', message: 'La note de 8/20 attribuée à mon enfant Moussa au devoir n°2 de Mathématiques me semble incorrecte.', statut: 'en_cours', date: '15/01/2026', reponse: 'Votre réclamation a été transmise au professeur concerné.' },
  { id: 'r2', sujet: 'Absence injustifiée', message: 'Mon enfant Aminata avait un certificat médical pour l\'absence du 10/01.', statut: 'resolu', date: '12/01/2026', reponse: 'L\'absence a été mise à jour comme justifiée.' },
  { id: 'r3', sujet: 'Erreur sur le bulletin', message: 'La mention sur le bulletin du T1 est erronée.', statut: 'ouvert', date: '20/01/2026', reponse: null },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ouvert: { label: 'Ouvert', bg: '#eff6ff', color: '#2563eb' },
  en_cours: { label: 'En cours', bg: '#fef3c7', color: '#d97706' },
  resolu: { label: 'Résolu', bg: '#dcfce7', color: '#16a34a' },
};

export default function ParentReclamationsPage() {
  const { data } = useParentReclamations();
  const rawList = Array.isArray(data) ? data : (data?.reclamations ?? data?.data ?? []);
  const reclamations = rawList.length > 0 ? rawList : STATIC_RECLAMATIONS;
  const creerReclamation = useCreerReclamationParent();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sujet: '', message: '', motif: '' });

  const handleSubmit = async () => {
    try {
      await creerReclamation.mutateAsync({ motif: form.motif || form.message || form.sujet, sujet: form.sujet });
      setShowModal(false);
      setForm({ sujet: '', message: '', motif: '' });
    } catch {
      // handled by hook
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#2563eb', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Réclamations</div>
          <div style={{ fontSize: 12, color: '#bfdbfe' }}>{(reclamations as Record<string, unknown>[]).length} réclamation(s)</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle réclamation
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(reclamations as Record<string, unknown>[]).map((r) => {
          const statut = (r.statut ?? 'ouvert') as string;
          const st = STATUT_MAP[statut] ?? STATUT_MAP.ouvert;
          const reponse = r.reponse as string | null;
          return (
            <div key={String(r.id)} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{(r.sujet ?? '') as string}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', flexShrink: 0, marginLeft: 12 }}>{st.label}</span>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{(r.message ?? '') as string}</div>
              {reponse && (
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 14px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>Réponse de l'établissement</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{reponse}</div>
                </div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Soumise le {(r.date ?? '') as string}</div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouvelle réclamation</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Sujet</label>
              <input value={form.sujet} onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))} placeholder="Ex: Note contestée, absence injustifiée…" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Message</label>
              <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={5} placeholder="Décrivez votre réclamation en détail…" style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={creerReclamation.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: creerReclamation.isPending ? 0.7 : 1 }}>
                {creerReclamation.isPending ? 'Envoi…' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
