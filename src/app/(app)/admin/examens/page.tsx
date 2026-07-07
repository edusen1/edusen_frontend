'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type StatutExamen = 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
type TypeExamen = 'COMPOSITION' | 'EXAMEN_FINAL' | 'RATTRAPAGE' | 'CONCOURS';

interface Examen {
  id: string;
  titre: string;
  type: TypeExamen;
  trimestre: string;
  dateDebut: string;
  dateFin: string;
  classes: string[];
  salle: string;
  surveillance: string;
  statut: StatutExamen;
  nbCandidats: number;
  pvGenere?: boolean;
  resultatsPublies?: boolean;
}

const STATIC_EXAMENS: Examen[] = [
  { id: 'e1', titre: 'Composition T3 — Mathématiques', type: 'COMPOSITION', trimestre: 'T3', dateDebut: '2026-07-07', dateFin: '2026-07-07', classes: ['3ème B', '3ème A', '4ème A'], salle: 'Salle A01 + A02', surveillance: 'M. Sall + Mme Diop', statut: 'PLANIFIE', nbCandidats: 128, pvGenere: false, resultatsPublies: false },
  { id: 'e2', titre: 'Composition T3 — Français', type: 'COMPOSITION', trimestre: 'T3', dateDebut: '2026-07-08', dateFin: '2026-07-08', classes: ['6ème A', '6ème B'], salle: 'Salle B04', surveillance: 'Mme Fall + M. Ba', statut: 'PLANIFIE', nbCandidats: 87, pvGenere: false, resultatsPublies: false },
  { id: 'e3', titre: 'Examen Blanc Terminale — T2', type: 'EXAMEN_FINAL', trimestre: 'T2', dateDebut: '2026-03-10', dateFin: '2026-03-12', classes: ['Terminale S1', 'Terminale L1'], salle: 'Grande salle C06', surveillance: 'M. Diallo + M. Cissé', statut: 'TERMINE', nbCandidats: 65, pvGenere: true, resultatsPublies: true },
  { id: 'e4', titre: 'Rattrapage T1 — Sciences', type: 'RATTRAPAGE', trimestre: 'T1', dateDebut: '2025-12-20', dateFin: '2025-12-20', classes: ['5ème C'], salle: 'Salle A02', surveillance: 'Mme Ndiaye', statut: 'TERMINE', nbCandidats: 12, pvGenere: true, resultatsPublies: true },
];

const TYPE_MAP: Record<TypeExamen, { label: string; bg: string; color: string }> = {
  COMPOSITION:   { label: 'Composition',    bg: '#eff6ff', color: '#2563eb' },
  EXAMEN_FINAL:  { label: 'Examen final',   bg: '#f5f3ff', color: '#7c3aed' },
  RATTRAPAGE:    { label: 'Rattrapage',     bg: '#fef3c7', color: '#d97706' },
  CONCOURS:      { label: 'Concours',       bg: '#fce7f3', color: '#db2777' },
};

const STATUT_MAP: Record<StatutExamen, { label: string; bg: string; color: string }> = {
  PLANIFIE:  { label: 'Planifié',   bg: '#eff6ff', color: '#2563eb'  },
  EN_COURS:  { label: 'En cours',   bg: '#fef3c7', color: '#d97706'  },
  TERMINE:   { label: 'Terminé',    bg: '#dcfce7', color: '#16a34a'  },
  ANNULE:    { label: 'Annulé',     bg: '#fee2e2', color: '#dc2626'  },
};

function inp(): React.CSSProperties { return { width: '100%', height: 36, border: '1px solid #d9e0e8', padding: '0 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }; }
function lbl(): React.CSSProperties { return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }; }

const EMPTY = { titre: '', type: 'COMPOSITION' as TypeExamen, trimestre: 'T3', dateDebut: '', dateFin: '', classes: '', salle: '', surveillance: '', nbCandidats: '' };

export default function ExamensPage() {
  const [examens, setExamens] = useState<Examen[]>(STATIC_EXAMENS);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterTrimestre, setFilterTrimestre] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // ── Règles métier ──
  const canPublierResultats = (e: Examen) => e.statut === 'TERMINE' && e.pvGenere && !e.resultatsPublies;
  const canGenererPv = (e: Examen) => e.statut === 'TERMINE' && !e.pvGenere;

  const filtered = examens.filter((e) =>
    (!filterStatut || e.statut === filterStatut) &&
    (!filterTrimestre || e.trimestre === filterTrimestre) &&
    (!search || e.titre.toLowerCase().includes(search.toLowerCase()) || e.classes.some((c) => c.toLowerCase().includes(search.toLowerCase())))
  );

  const handleCreate = () => {
    if (!form.titre.trim()) { toast.error('Le titre est obligatoire'); return; }
    if (!form.dateDebut) { toast.error('La date de début est obligatoire'); return; }
    if (!form.salle.trim()) { toast.error('La salle est obligatoire'); return; }
    if (!form.surveillance.trim()) { toast.error('Les surveillants sont obligatoires'); return; }
    if (!form.classes.trim()) { toast.error('Au moins une classe est requise'); return; }
    if (form.dateFin && form.dateFin < form.dateDebut) { toast.error('La date de fin doit être après la date de début'); return; }
    const newEx: Examen = {
      id: `ex${Date.now()}`, titre: form.titre, type: form.type, trimestre: form.trimestre,
      dateDebut: form.dateDebut, dateFin: form.dateFin || form.dateDebut,
      classes: form.classes.split(',').map((c) => c.trim()).filter(Boolean),
      salle: form.salle, surveillance: form.surveillance,
      statut: 'PLANIFIE', nbCandidats: Number(form.nbCandidats) || 0,
      pvGenere: false, resultatsPublies: false,
    };
    setExamens((prev) => [newEx, ...prev]);
    setShowModal(false);
    setForm(EMPTY);
    toast.success('Examen planifié');
  };

  const handleGenererPv = (id: string) => {
    setExamens((prev) => prev.map((e) => e.id === id ? { ...e, pvGenere: true } : e));
    toast.success('Procès-verbal généré');
  };

  const handlePublier = (id: string) => {
    setExamens((prev) => prev.map((e) => e.id === id ? { ...e, resultatsPublies: true } : e));
    toast.success('Résultats publiés — Les élèves et parents sont notifiés');
  };

  const handleAnnuler = (id: string) => {
    if (!confirm('Annuler cet examen ?')) return;
    setExamens((prev) => prev.map((e) => e.id === id ? { ...e, statut: 'ANNULE' } : e));
    toast.success('Examen annulé');
  };

  const nbPlanifies = examens.filter((e) => e.statut === 'PLANIFIE').length;
  const nbTermines = examens.filter((e) => e.statut === 'TERMINE').length;
  const nbPvManquants = examens.filter((e) => e.statut === 'TERMINE' && !e.pvGenere).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Examens & Compositions</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Planification, surveillance, PV et publication des résultats</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ height: 38, padding: '0 16px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
          Planifier un examen
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 12 }}>
        {[
          { label: 'Planifiés', value: nbPlanifies, color: '#2563eb' },
          { label: 'Terminés', value: nbTermines, color: '#16a34a' },
          { label: 'PV manquants', value: nbPvManquants, color: '#d97706' },
          { label: 'Total sessions', value: examens.length, color: '#475569' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, maxWidth: 300, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Titre ou classe…" style={{ border: 'none', outline: 'none', fontSize: 13, height: 36, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
        </div>
        <select value={filterTrimestre} onChange={(e) => setFilterTrimestre(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Tous les trimestres</option>
          <option value="T1">Trimestre 1</option>
          <option value="T2">Trimestre 2</option>
          <option value="T3">Trimestre 3</option>
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px solid #e6ebf1' }}>Aucun examen trouvé</div>}
          {filtered.map((ex) => {
            const tl = TYPE_MAP[ex.type];
            const sl = STATUT_MAP[ex.statut];
            return (
              <div key={ex.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{ex.titre}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tl.color, background: tl.bg, padding: '2px 8px' }}>{tl.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sl.color, background: sl.bg, padding: '2px 8px' }}>{sl.label}</span>
                      {ex.pvGenere && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 7px' }}>PV généré</span>}
                      {ex.resultatsPublies && <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px' }}>Résultats publiés</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE</span><div style={{ fontSize: 12, color: '#334155' }}>{new Date(ex.dateDebut).toLocaleDateString('fr-FR')}{ex.dateFin !== ex.dateDebut ? ' → ' + new Date(ex.dateFin).toLocaleDateString('fr-FR') : ''}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CLASSES</span><div style={{ fontSize: 12, color: '#334155' }}>{ex.classes.join(', ')}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>SALLE</span><div style={{ fontSize: 12, color: '#334155' }}>{ex.salle}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>CANDIDATS</span><div style={{ fontSize: 12, color: '#334155' }}>{ex.nbCandidats}</div></div>
                    </div>
                    <div style={{ marginTop: 8 }}><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>SURVEILLANCE</span><span style={{ fontSize: 12, color: '#334155', marginLeft: 8 }}>{ex.surveillance}</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {canGenererPv(ex) && (
                      <button onClick={() => handleGenererPv(ex.id)} style={{ height: 30, padding: '0 12px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Générer PV
                      </button>
                    )}
                    {canPublierResultats(ex) && (
                      <button onClick={() => handlePublier(ex.id)} style={{ height: 30, padding: '0 12px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Publier résultats
                      </button>
                    )}
                    {ex.statut === 'PLANIFIE' && (
                      <button onClick={() => handleAnnuler(ex.id)} style={{ height: 30, padding: '0 12px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 560, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.16)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Planifier un examen / composition</div>
            <div style={{ marginBottom: 12 }}><label style={lbl()}>Titre *</label><input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} style={inp()} placeholder="Ex: Composition T3 — Mathématiques" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl()}>Type</label><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeExamen }))} style={{ ...inp(), background: '#fff' }}>{Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div><label style={lbl()}>Trimestre</label><select value={form.trimestre} onChange={(e) => setForm((f) => ({ ...f, trimestre: e.target.value }))} style={{ ...inp(), background: '#fff' }}><option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl()}>Date de début *</label><input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={inp()} /></div>
              <div><label style={lbl()}>Date de fin</label><input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={inp()} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl()}>Classes concernées * (séparées par des virgules)</label><input value={form.classes} onChange={(e) => setForm((f) => ({ ...f, classes: e.target.value }))} style={inp()} placeholder="3ème B, 4ème A, 5ème C" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl()}>Salle *</label><input value={form.salle} onChange={(e) => setForm((f) => ({ ...f, salle: e.target.value }))} style={inp()} placeholder="Salle A01" /></div>
              <div><label style={lbl()}>Nb de candidats</label><input type="number" value={form.nbCandidats} onChange={(e) => setForm((f) => ({ ...f, nbCandidats: e.target.value }))} style={inp()} min="0" /></div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={lbl()}>Surveillants *</label><input value={form.surveillance} onChange={(e) => setForm((f) => ({ ...f, surveillance: e.target.value }))} style={inp()} placeholder="M. Sall + Mme Diop" /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleCreate} style={{ height: 38, padding: '0 20px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Planifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
