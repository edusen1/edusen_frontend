'use client';

import { useState } from 'react';
import { useProfesseurAbsences, useDeclarerAbsenceProfesseur } from '@/hooks/use-query-api';

const STATIC_ABSENCES = [
  { id: 'a1', dateDebut: '2025-11-15', dateFin: '2025-11-16', heureDebut: '', heureFin: '', typeAbsence: 'MALADIE', motif: 'Certificat médical fourni', statut: 'APPROUVEE' },
  { id: 'a2', dateDebut: '2025-12-03', dateFin: '2025-12-03', heureDebut: '', heureFin: '', typeAbsence: 'CONGE', motif: 'Autorisé par la direction', statut: 'APPROUVEE' },
  { id: 'a3', dateDebut: '2026-01-20', dateFin: '2026-01-20', heureDebut: '', heureFin: '', typeAbsence: 'AUTRE', motif: 'Raison personnelle', statut: 'EN_ATTENTE' },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  APPROUVEE: { label: 'Approuvée', bg: '#dcfce7', color: '#16a34a' },
  REJETEE: { label: 'Rejetée', bg: '#fee2e2', color: '#dc2626' },
  // legacy keys from static data
  justifié: { label: 'Justifiée', bg: '#dcfce7', color: '#16a34a' },
  non_justifié: { label: 'Non justifiée', bg: '#fee2e2', color: '#dc2626' },
};

const TYPE_LABELS: Record<string, string> = {
  MALADIE: 'Maladie',
  CONGE: 'Congé',
  SANS_SOLDE: 'Sans solde',
  AUTRE: 'Autre',
};

const EMPTY_FORM = {
  dateDebut: '',
  dateFin: '',
  heureDebut: '',
  heureFin: '',
  typeAbsence: '',
  motif: '',
};

export default function ProfesseurAbsencesPage() {
  const { data } = useProfesseurAbsences();
  const declarer = useDeclarerAbsenceProfesseur();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const raw = Array.isArray(data) ? data : (data?.absences ?? data?.data ?? []);
  const absences = (raw as Record<string, unknown>[]).length > 0
    ? (raw as Record<string, unknown>[]).map((a, i) => ({
        id: String(a.id ?? a._id ?? i),
        dateDebut: String(a.dateDebut ?? a.date ?? ''),
        dateFin: String(a.dateFin ?? a.dateDebut ?? a.date ?? ''),
        heureDebut: String(a.heureDebut ?? ''),
        heureFin: String(a.heureFin ?? ''),
        typeAbsence: String(a.typeAbsence ?? a.type ?? 'AUTRE'),
        motif: String(a.motif ?? a.raison ?? a.commentaire ?? ''),
        statut: String(a.statut ?? 'EN_ATTENTE'),
      }))
    : STATIC_ABSENCES;

  const nbApprouvees = absences.filter((a) => a.statut === 'APPROUVEE' || a.statut === 'justifié').length;
  const nbEnAttente = absences.filter((a) => a.statut === 'EN_ATTENTE').length;
  const nbRejetees = absences.filter((a) => a.statut === 'REJETEE' || a.statut === 'non_justifié').length;

  const handleSubmit = () => {
    if (!form.dateDebut || !form.typeAbsence || !form.motif) return;
    declarer.mutate(form, {
      onSuccess: () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
      },
    });
  };

  const f = (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Mes absences</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Année scolaire 2025–2026</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Déclarer une absence
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Total absences', count: absences.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Approuvées', count: nbApprouvees, color: '#16a34a', bg: '#dcfce7' },
          { label: 'En attente', count: nbEnAttente, color: '#d97706', bg: '#fef3c7' },
          { label: 'Rejetées', count: nbRejetees, color: '#dc2626', bg: '#fee2e2' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 120px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 120px 120px 1fr 110px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 680 }}>
            {['Date début', 'Date fin', 'Heures', 'Type', 'Motif', 'Statut'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {absences.map((a, idx) => {
            const st = STATUT_MAP[a.statut] ?? STATUT_MAP.EN_ATTENTE;
            const heures = a.heureDebut && a.heureFin ? `${a.heureDebut}–${a.heureFin}` : '—';
            return (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '120px 120px 120px 120px 1fr 110px', padding: '13px 18px', borderBottom: idx < absences.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 680 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f(a.dateDebut)}</span>
                <span style={{ fontSize: 13, color: '#475569' }}>{f(a.dateFin)}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{heures}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{TYPE_LABELS[a.typeAbsence] ?? a.typeAbsence}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{a.motif || '—'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
              </div>
            );
          })}
          {absences.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence enregistrée</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Déclarer une absence</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date début *</label>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date fin *</label>
                <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Heure début</label>
                <input type="time" value={form.heureDebut} onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Heure fin</label>
                <input type="time" value={form.heureFin} onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type d&apos;absence *</label>
              <select value={form.typeAbsence} onChange={(e) => setForm((f) => ({ ...f, typeAbsence: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
                <option value="">Sélectionner…</option>
                <option value="MALADIE">Maladie</option>
                <option value="CONGE">Congé</option>
                <option value="SANS_SOLDE">Sans solde</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif *</label>
              <textarea value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} rows={3} placeholder="Décrivez la raison de votre absence…" style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={declarer.isPending || !form.dateDebut || !form.typeAbsence || !form.motif}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (!form.dateDebut || !form.typeAbsence || !form.motif) ? 0.5 : 1 }}
              >
                {declarer.isPending ? 'Envoi…' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
