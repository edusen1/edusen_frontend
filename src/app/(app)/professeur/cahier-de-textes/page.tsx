'use client';

import { useState } from 'react';
import { useCahierTexte, useCreerCahierTexte, useProfesseurMesClasses } from '@/hooks/use-query-api';

const STATIC_ENTREES = [
  { id: 1, date: '2025-06-27', classe: '3ème B', matiere: 'Mathématiques', contenu: 'Révision du théorème de Pythagore. Exercices 5, 6, 7 du manuel p.92. Correction en classe des devoirs.', devoirs: 'Exercice 8 p.93 pour jeudi' },
  { id: 2, date: '2025-06-26', classe: '4ème A', matiere: 'Mathématiques', contenu: 'Introduction aux fractions. Définition numérateur/dénominateur. Exercices d\'application.', devoirs: '' },
  { id: 3, date: '2025-06-25', classe: '2nde C', matiere: 'Sciences Physiques', contenu: 'TP — Circuit électrique en série et en dérivation. Observations et mesures de tension.', devoirs: 'Rédiger le compte-rendu du TP pour vendredi' },
  { id: 4, date: '2025-06-24', classe: '3ème B', matiere: 'Mathématiques', contenu: 'Évaluation de contrôle — Fonctions linéaires et affines.', devoirs: '' },
];

const EMPTY_FORM = { classeId: '', dateCours: '', contenuTraite: '', observations: '' };

export default function CahierDeTextesPage() {
  const { data: cahierData } = useCahierTexte();
  const { data: classesData } = useProfesseurMesClasses();
  const creer = useCreerCahierTexte();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const rawEntrees = Array.isArray(cahierData) ? cahierData : (cahierData?.entrees ?? cahierData?.data ?? []);
  const entrees = (rawEntrees as Record<string, unknown>[]).length > 0
    ? (rawEntrees as Record<string, unknown>[]).map((e, i) => ({
        id: String(e.id ?? e._id ?? i),
        date: String(e.dateCours ?? e.date ?? ''),
        classe: String(e.classe ?? e.className ?? ''),
        matiere: String(e.matiere ?? e.matiereName ?? ''),
        contenu: String(e.contenuTraite ?? e.contenu ?? ''),
        devoirs: String(e.observations ?? e.devoirs ?? ''),
      }))
    : STATIC_ENTREES;

  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes ?? classesData?.data ?? []);
  const classes = (rawClasses as Record<string, unknown>[]).map((c) => ({
    id: String(c.id ?? c._id ?? ''),
    nom: String(c.nom ?? c.className ?? c.classe ?? ''),
  }));

  const handleSubmit = () => {
    if (!form.dateCours || !form.contenuTraite) return;
    creer.mutate(form, {
      onSuccess: () => { setShowModal(false); setForm(EMPTY_FORM); },
    });
  };

  const fd = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Cahier de textes</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Suivi des contenus des cours</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter
        </button>
      </div>

      {/* Entries list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780 }}>
        {entrees.map((e) => (
          <div key={e.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* Icon */}
              <div style={{ width: 40, height: 40, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{e.matiere}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px' }}>{e.classe}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{fd(e.date)}</span>
                </div>

                {/* Content */}
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: e.devoirs ? 10 : 0 }}>{e.contenu}</p>

                {/* Devoirs/observations */}
                {e.devoirs && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 3 }}>Observations / Devoir</div>
                    <div style={{ fontSize: 12, color: '#92400e' }}>{e.devoirs}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {entrees.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Aucune entrée dans le cahier de textes</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouvelle entrée</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe</label>
                <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
                  <option value="">Sélectionner…</option>
                  {classes.length > 0
                    ? classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)
                    : ['3ème B', '4ème A', '2nde C', '5ème C'].map((c) => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date du cours *</label>
                <input type="date" value={form.dateCours} onChange={(e) => setForm((f) => ({ ...f, dateCours: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Contenu traité *</label>
              <textarea value={form.contenuTraite} onChange={(e) => setForm((f) => ({ ...f, contenuTraite: e.target.value }))} rows={4} placeholder="Décrivez ce qui a été fait en cours…" style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Observations / Devoirs (optionnel)</label>
              <input type="text" value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} placeholder="Ex : Exercice 5 p.45 pour jeudi…" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={handleSubmit}
                disabled={creer.isPending || !form.dateCours || !form.contenuTraite}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (!form.dateCours || !form.contenuTraite) ? 0.5 : 1 }}
              >
                {creer.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
