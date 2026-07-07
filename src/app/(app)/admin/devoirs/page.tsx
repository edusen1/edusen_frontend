'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Devoir {
  id: string;
  titre: string;
  matiere: string;
  classe: string;
  professeur: string;
  dateDonnee: string;
  dateRemise: string;
  trimestre: string;
  statut: 'PROGRAMME' | 'EN_COURS' | 'RENDU' | 'CORRIGE';
  nbEleves: number;
  nbRendus: number;
}

const STATIC_DEVOIRS: Devoir[] = [
  { id: 'd1', titre: 'Exercices sur les équations du 2nd degré', matiere: 'Mathématiques', classe: '3ème B', professeur: 'M. Diallo', dateDonnee: '2026-06-25', dateRemise: '2026-07-02', trimestre: 'T3', statut: 'EN_COURS', nbEleves: 42, nbRendus: 28 },
  { id: 'd2', titre: 'Rédaction — Le personnage de roman', matiere: 'Français', classe: '4ème A', professeur: 'Mme Sarr', dateDonnee: '2026-06-24', dateRemise: '2026-07-01', trimestre: 'T3', statut: 'EN_COURS', nbEleves: 38, nbRendus: 38 },
  { id: 'd3', titre: 'Questions sur la 1ère Guerre Mondiale', matiere: 'Histoire-Géo', classe: '3ème B', professeur: 'M. Ndiaye', dateDonnee: '2026-06-20', dateRemise: '2026-06-27', trimestre: 'T3', statut: 'RENDU', nbEleves: 42, nbRendus: 42 },
  { id: 'd4', titre: 'TP — Dissection de fleur', matiere: 'SVT', classe: '5ème C', professeur: 'Mme Fall', dateDonnee: '2026-06-18', dateRemise: '2026-06-25', trimestre: 'T3', statut: 'CORRIGE', nbEleves: 40, nbRendus: 39 },
  { id: 'd5', titre: 'Analyse de circuit électrique', matiere: 'Sciences Physiques', classe: '6ème A', professeur: 'M. Ba', dateDonnee: '2026-07-01', dateRemise: '2026-07-08', trimestre: 'T3', statut: 'PROGRAMME', nbEleves: 44, nbRendus: 0 },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PROGRAMME: { label: 'Programmé',  bg: '#eff6ff', color: '#2563eb' },
  EN_COURS:  { label: 'En cours',   bg: '#fef3c7', color: '#d97706' },
  RENDU:     { label: 'Rendu',      bg: '#dcfce7', color: '#16a34a' },
  CORRIGE:   { label: 'Corrigé',    bg: '#f5f3ff', color: '#7c3aed' },
};

function inp(): React.CSSProperties { return { width: '100%', height: 36, border: '1px solid #d9e0e8', padding: '0 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }; }
function lbl(): React.CSSProperties { return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }; }
const EMPTY = { titre: '', matiere: '', classe: '', professeur: '', dateDonnee: '', dateRemise: '', trimestre: 'T3' };

export default function DevoirsPage() {
  const [devoirs, setDevoirs] = useState<Devoir[]>(STATIC_DEVOIRS);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterTrimestre, setFilterTrimestre] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const filtered = devoirs.filter((d) =>
    (!search || d.titre.toLowerCase().includes(search.toLowerCase()) || d.matiere.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatut || d.statut === filterStatut) &&
    (!filterClasse || d.classe === filterClasse) &&
    (!filterTrimestre || d.trimestre === filterTrimestre)
  );

  const classes = [...new Set(devoirs.map((d) => d.classe))];

  const handleCreate = () => {
    if (!form.titre.trim()) { toast.error('Le titre est obligatoire'); return; }
    if (!form.matiere.trim()) { toast.error('La matière est obligatoire'); return; }
    if (!form.classe.trim()) { toast.error('La classe est obligatoire'); return; }
    if (!form.dateDonnee) { toast.error('La date donnée est obligatoire'); return; }
    if (!form.dateRemise) { toast.error('La date de remise est obligatoire'); return; }
    if (form.dateRemise < form.dateDonnee) { toast.error('La date de remise doit être après la date donnée'); return; }
    const newD: Devoir = { id: `d${Date.now()}`, ...form, statut: 'PROGRAMME', nbEleves: 0, nbRendus: 0 };
    setDevoirs((prev) => [newD, ...prev]);
    setShowModal(false);
    setForm(EMPTY);
    toast.success('Devoir programmé');
  };

  // Statistiques
  const nbRetard = devoirs.filter((d) => d.statut === 'EN_COURS' && new Date(d.dateRemise) < new Date()).length;
  const nbNonRenduTotal = devoirs.filter((d) => d.statut === 'RENDU' || d.statut === 'EN_COURS').reduce((s, d) => s + (d.nbEleves - d.nbRendus), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Devoirs</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Programmation, suivi des rendus et répartition par classe</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ height: 38, padding: '0 16px', border: 'none', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
          Programmer un devoir
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 12 }}>
        {[
          { label: 'Total devoirs', value: devoirs.length, color: '#0f172a' },
          { label: 'En cours', value: devoirs.filter((d) => d.statut === 'EN_COURS').length, color: '#d97706' },
          { label: 'En retard de remise', value: nbRetard, color: '#dc2626' },
          { label: 'Copies non rendues', value: nbNonRenduTotal, color: '#7c3aed' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, maxWidth: 280, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Titre ou matière…" style={{ border: 'none', outline: 'none', fontSize: 13, height: 36, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
        </div>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterTrimestre} onChange={(e) => setFilterTrimestre(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Tous trimestres</option>
          <option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option>
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 28px 0' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 110px 160px 120px 110px 100px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
            {['Devoir / Matière', 'Classe', 'Trimestre', 'Professeur', 'Date remise', 'Avancement', 'Statut'].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Aucun devoir trouvé</div>}
            {filtered.map((d, idx) => {
              const sl = STATUT_MAP[d.statut];
              const pct = d.nbEleves > 0 ? Math.round((d.nbRendus / d.nbEleves) * 100) : 0;
              const enRetard = d.statut === 'EN_COURS' && new Date(d.dateRemise) < new Date();
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 110px 160px 120px 110px 100px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{d.titre}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{d.matiere}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#475569' }}>{d.classe}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{d.trimestre}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{d.professeur}</span>
                  <span style={{ fontSize: 12, color: enRetard ? '#dc2626' : '#475569', fontWeight: enRetard ? 700 : 400 }}>
                    {new Date(d.dateRemise).toLocaleDateString('fr-FR')}
                    {enRetard && <span style={{ display: 'block', fontSize: 10, color: '#dc2626' }}>En retard</span>}
                  </span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{d.nbRendus}/{d.nbEleves}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#16a34a' : '#d97706' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: '#f1f5f9' }}>
                      <div style={{ height: '100%', background: pct === 100 ? '#16a34a' : '#d97706', width: `${pct}%` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sl.color, background: sl.bg, padding: '3px 8px', display: 'inline-block' }}>{sl.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 520, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.16)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Programmer un devoir</div>
            <div style={{ marginBottom: 12 }}><label style={lbl()}>Titre *</label><input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} style={inp()} placeholder="Ex: Exercices sur les fractions" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl()}>Matière *</label><input value={form.matiere} onChange={(e) => setForm((f) => ({ ...f, matiere: e.target.value }))} style={inp()} placeholder="Mathématiques" /></div>
              <div><label style={lbl()}>Classe *</label><input value={form.classe} onChange={(e) => setForm((f) => ({ ...f, classe: e.target.value }))} style={inp()} placeholder="3ème B" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={lbl()}>Professeur *</label><input value={form.professeur} onChange={(e) => setForm((f) => ({ ...f, professeur: e.target.value }))} style={inp()} placeholder="M. Diallo" /></div>
              <div><label style={lbl()}>Trimestre</label><select value={form.trimestre} onChange={(e) => setForm((f) => ({ ...f, trimestre: e.target.value }))} style={{ ...inp(), background: '#fff' }}><option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div><label style={lbl()}>Date donnée *</label><input type="date" value={form.dateDonnee} onChange={(e) => setForm((f) => ({ ...f, dateDonnee: e.target.value }))} style={inp()} /></div>
              <div><label style={lbl()}>Date de remise *</label><input type="date" value={form.dateRemise} onChange={(e) => setForm((f) => ({ ...f, dateRemise: e.target.value }))} style={inp()} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: '#334155', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleCreate} style={{ height: 38, padding: '0 20px', border: 'none', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Programmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
