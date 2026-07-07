'use client';

import { useState } from 'react';
import {
  useSurveillantAbsences, useSurveillantClasses, useSurveillantEleves,
  useCreateAbsenceEleve, useApprouverAbsence, useRejeterAbsence,
} from '@/hooks/use-query-api';

// TypeAbsence enum du backend
const TYPE_ABSENCE = [
  { value: 'JOURNEE_COMPLETE', label: 'Journée complète' },
  { value: 'DEMI_JOURNEE', label: 'Demi-journée' },
  { value: 'COURS_SPECIFIQUE', label: 'Cours spécifique' },
  { value: 'RETARD', label: 'Retard' },
];

const STATIC_ABS = [
  { id: 's1', eleveId: null, eleve: 'Moussa Diallo', classe: '3ème B', date: '2026-06-27', typeAbsence: 'JOURNEE_COMPLETE', motif: 'Maladie', statut: 'APPROUVEE', justifiee: true },
  { id: 's2', eleveId: null, eleve: 'Fatou Sall', classe: '6ème A', date: '2026-06-27', typeAbsence: 'RETARD', motif: '', statut: 'EN_ATTENTE', justifiee: false },
  { id: 's3', eleveId: null, eleve: 'Ibrahima Ba', classe: '4ème A', date: '2026-06-28', typeAbsence: 'COURS_SPECIFIQUE', motif: 'Rdv médical', statut: 'EN_ATTENTE', justifiee: false },
  { id: 's4', eleveId: null, eleve: 'Aissatou Ndiaye', classe: '2nde C', date: '2026-06-29', typeAbsence: 'RETARD', motif: 'Transport', statut: 'REJETEE', justifiee: false },
];

type FilterStatut = 'tous' | 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
type FilterType = 'tous' | 'JOURNEE_COMPLETE' | 'DEMI_JOURNEE' | 'COURS_SPECIFIQUE' | 'RETARD';

const EMPTY_FORM = { eleveId: '', date: new Date().toISOString().split('T')[0], typeAbsence: 'JOURNEE_COMPLETE', motif: '', justifiee: false };

function fd(v: unknown): string {
  try { return new Date(String(v)).toLocaleDateString('fr-FR'); } catch { return String(v ?? '—'); }
}

const STATUT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  APPROUVEE: { label: 'Approuvée', color: '#16a34a', bg: '#dcfce7' },
  REJETEE: { label: 'Rejetée', color: '#dc2626', bg: '#fee2e2' },
  EN_ATTENTE: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
};

export default function SurveillantAbsencesPage() {
  const { data: absData, isLoading } = useSurveillantAbsences();
  const { data: elevesData } = useSurveillantEleves();
  const { data: classesData } = useSurveillantClasses();

  const createAbsence = useCreateAbsenceEleve();
  const approuver = useApprouverAbsence();
  const rejeter = useRejeterAbsence();

  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const rawAbs = Array.isArray(absData) ? absData : (absData?.content ?? absData?.data ?? []) as Record<string, unknown>[];
  const absences = rawAbs.length > 0 ? rawAbs : STATIC_ABS;

  const rawEleves = Array.isArray(elevesData) ? elevesData : (elevesData?.content ?? elevesData?.data ?? []) as Record<string, unknown>[];
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.content ?? classesData?.data ?? []) as Record<string, unknown>[];

  const filtered = absences.filter((a) => {
    const s = String(a.statut ?? 'EN_ATTENTE');
    const t = String(a.typeAbsence ?? '');
    const d = String(a.date ?? a.createdAt ?? '');
    const nom = String(a.eleve ?? (a.eleveNom ?? '') + ' ' + (a.elevePrenom ?? '')).toLowerCase();
    return (filterStatut === 'tous' || s === filterStatut)
      && (filterType === 'tous' || t === filterType)
      && (!filterDate || d.startsWith(filterDate))
      && (!search || nom.includes(search.toLowerCase()));
  });

  const nbEnAttente = absences.filter((a) => a.statut === 'EN_ATTENTE' || !a.statut).length;
  const nbApprouv = absences.filter((a) => a.statut === 'APPROUVEE').length;
  const nbRejet = absences.filter((a) => a.statut === 'REJETEE').length;
  const nbRetards = absences.filter((a) => a.typeAbsence === 'RETARD').length;

  const handleCreate = async () => {
    if (!form.eleveId || !form.date) return;
    await createAbsence.mutateAsync(form);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const inp: React.CSSProperties = { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Absences & Retards</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{nbEnAttente} en attente de traitement</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Déclarer
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente', value: nbEnAttente, color: '#d97706', bg: '#fef3c7', filter: 'EN_ATTENTE' },
          { label: 'Approuvées', value: nbApprouv, color: '#16a34a', bg: '#dcfce7', filter: 'APPROUVEE' },
          { label: 'Rejetées', value: nbRejet, color: '#dc2626', bg: '#fee2e2', filter: 'REJETEE' },
          { label: 'Retards', value: nbRetards, color: '#d97706', bg: '#fef3c7', filter: 'tous' },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => setFilterStatut(s.filter === 'tous' ? 'tous' : s.filter as FilterStatut)}
            style={{ flex: '1 1 140px', background: '#fff', border: `1px solid ${filterStatut === s.filter && s.filter !== 'tous' ? s.color : '#e6ebf1'}`, padding: '13px 18px', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: '1 1 180px', maxWidth: 260 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher élève…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        {/* Type filter */}
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as FilterType)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="tous">Tous types</option>
          {TYPE_ABSENCE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {/* Date filter */}
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }} />
        {/* Statut tabs */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0' }}>
          {(['tous', 'EN_ATTENTE', 'APPROUVEE', 'REJETEE'] as FilterStatut[]).map((f) => {
            const labels: Record<FilterStatut, string> = { tous: 'Tous', EN_ATTENTE: 'En attente', APPROUVEE: 'Approuvées', REJETEE: 'Rejetées' };
            return (
              <button key={f} onClick={() => setFilterStatut(f)} style={{ padding: '7px 12px', fontSize: 12, fontWeight: filterStatut === f ? 700 : 400, background: filterStatut === f ? '#2563eb' : 'transparent', color: filterStatut === f ? '#fff' : '#475569', border: 'none', borderLeft: f !== 'tous' ? '1px solid #e6ebf1' : 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 150px 110px 120px 110px 130px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 840 }}>
              {['Élève', 'Date', 'Type', 'Motif', 'Justifiée', 'Statut', 'Actions'].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((a, idx) => {
              const statut = String(a.statut ?? 'EN_ATTENTE');
              const badge = STATUT_BADGE[statut] ?? STATUT_BADGE.EN_ATTENTE;
              const isRetard = a.typeAbsence === 'RETARD';
              const typeLabel = TYPE_ABSENCE.find((t) => t.value === a.typeAbsence)?.label ?? String(a.typeAbsence ?? '—');
              return (
                <div
                  key={String(a.id ?? idx)}
                  onClick={() => setDetail(a as Record<string, unknown>)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 110px 150px 110px 120px 110px 130px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 840, cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: isRetard ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: isRetard ? '#d97706' : '#dc2626' }}>
                      {isRetard ? '⏱' : '✗'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {String(a.eleve ?? (((a.elevePrenom ?? '') + ' ' + (a.eleveNom ?? '')) || '—'))}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{fd(a.date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isRetard ? '#d97706' : '#475569', background: isRetard ? '#fef3c7' : '#f1f5f9', padding: '2px 8px', display: 'inline-block' }}>{typeLabel}</span>
                  <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(a.motif ?? '—')}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: a.justifiee ? '#16a34a' : '#94a3b8' }}>{a.justifiee ? 'Oui' : 'Non'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: '3px 8px', display: 'inline-block' }}>{badge.label}</span>
                  {statut === 'EN_ATTENTE' ? (
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => approuver.mutate(String(a.id))} disabled={approuver.isPending} style={{ height: 28, padding: '0 10px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Justifier</button>
                      <button onClick={() => rejeter.mutate(String(a.id))} disabled={rejeter.isPending} style={{ height: 28, padding: '0 10px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                    </div>
                  ) : <div />}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence trouvée</div>
            )}
          </div>
        )}
      </div>

      {/* Modal déclarer */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Déclarer une absence / retard</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Type *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TYPE_ABSENCE.map((t) => (
                  <button key={t.value} onClick={() => setForm((f) => ({ ...f, typeAbsence: t.value }))}
                    style={{ padding: '6px 14px', fontSize: 12, fontWeight: form.typeAbsence === t.value ? 700 : 400, border: `1.5px solid ${form.typeAbsence === t.value ? '#2563eb' : '#d9e0e8'}`, background: form.typeAbsence === t.value ? '#eff6ff' : '#fff', color: form.typeAbsence === t.value ? '#2563eb' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Élève */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Élève *</label>
              {rawEleves.length > 0 ? (
                <select value={form.eleveId} onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Sélectionner un élève —</option>
                  {rawEleves.map((e) => (
                    <option key={String(e.id)} value={String(e.id)}>
                      {String(e.prenom ?? e.firstName ?? '')} {String(e.nom ?? e.lastName ?? '')} {e.classe ? `— ${String((e.classe as Record<string, unknown>)?.nom ?? e.classe)}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.eleveId} onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))} placeholder="ID ou nom de l'élève" style={inp} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Justifiée</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {[{ v: true, label: 'Oui' }, { v: false, label: 'Non' }].map(({ v, label }) => (
                    <button key={label} onClick={() => setForm((f) => ({ ...f, justifiee: v }))}
                      style={{ flex: 1, height: 38, border: `1.5px solid ${form.justifiee === v ? '#2563eb' : '#d9e0e8'}`, background: form.justifiee === v ? '#eff6ff' : '#fff', color: form.justifiee === v ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Motif</label>
              <input value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} placeholder="Maladie, transport, rendez-vous…" style={inp} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreate} disabled={createAbsence.isPending || !form.eleveId || !form.date}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createAbsence.isPending || !form.eleveId ? 0.6 : 1 }}>
                {createAbsence.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Détail absence</div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            {[
              { label: 'Élève', value: String(detail.eleve ?? (((detail.elevePrenom ?? '') + ' ' + (detail.eleveNom ?? '')) || '—')) },
              { label: 'Date', value: fd(detail.date) },
              { label: 'Type', value: TYPE_ABSENCE.find((t) => t.value === detail.typeAbsence)?.label ?? String(detail.typeAbsence ?? '—') },
              { label: 'Motif', value: String(detail.motif ?? '—') },
              { label: 'Justifiée', value: detail.justifiee ? 'Oui' : 'Non' },
              { label: 'Statut', value: STATUT_BADGE[String(detail.statut ?? 'EN_ATTENTE')]?.label ?? String(detail.statut ?? '—') },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
            {(detail.statut === 'EN_ATTENTE' || !detail.statut) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { approuver.mutate(String(detail.id)); setDetail(null); }} disabled={approuver.isPending}
                  style={{ flex: 1, height: 40, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  ✓ Approuver / Justifier
                </button>
                <button onClick={() => { rejeter.mutate(String(detail.id)); setDetail(null); }} disabled={rejeter.isPending}
                  style={{ flex: 1, height: 40, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  ✗ Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
