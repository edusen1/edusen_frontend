'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

type Incident = {
  id: string;
  eleve: string;
  classe: string;
  date: string;
  type: string;
  description: string;
  sanction: string;
  statut: string;
};

const SANCTIONS = [
  { value: 'AVERTISSEMENT',         label: 'Avertissement' },
  { value: 'RETENUE',               label: 'Retenue' },
  { value: 'EXCLUSION_COURS',       label: 'Exclusion de cours' },
  { value: 'EXCLUSION_TEMPORAIRE',  label: 'Exclusion temporaire' },
  { value: 'TRAVAUX_INTERET_SCOLAIRE', label: 'Travaux d\'intérêt scolaire' },
];

const TYPE_INCIDENT = ['Bagarre', 'Insolence', 'Triche', 'Dégradation', 'Harcèlement', 'Autre'];

const STATIC_INCIDENTS: Incident[] = [
  { id: 'i1', eleve: 'Moussa Diallo', classe: '3ᵉ B', date: '2026-01-28', type: 'Insolence', description: 'Insolence répétée envers le professeur de mathématiques.', sanction: 'AVERTISSEMENT', statut: 'TRAITE' },
  { id: 'i2', eleve: 'Ibrahima Fall', classe: '5ᵉ A', date: '2026-01-30', type: 'Bagarre', description: 'Bagarre dans la cour de récréation.', sanction: 'RETENUE', statut: 'EN_COURS' },
  { id: 'i3', eleve: 'Awa Cissé', classe: '4ᵉ B', date: '2026-02-01', type: 'Triche', description: 'Fraude lors du devoir de géographie.', sanction: 'EXCLUSION_COURS', statut: 'EN_COURS' },
  { id: 'i4', eleve: 'Cheikh Sarr', classe: '3ᵉ B', date: '2026-02-03', type: 'Dégradation', description: 'Dégradation de matériel scolaire (chaise cassée).', sanction: 'TRAVAUX_INTERET_SCOLAIRE', statut: 'EN_COURS' },
];

const SANCTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
  AVERTISSEMENT:              { label: 'Avertissement',       color: '#d97706', bg: '#fef3c7' },
  RETENUE:                    { label: 'Retenue',             color: '#ea580c', bg: '#ffedd5' },
  EXCLUSION_COURS:            { label: 'Exclu. cours',        color: '#dc2626', bg: '#fee2e2' },
  EXCLUSION_TEMPORAIRE:       { label: 'Exclu. temp.',        color: '#7c3aed', bg: '#f3e8ff' },
  TRAVAUX_INTERET_SCOLAIRE:   { label: 'T.I.S.',             color: '#0891b2', bg: '#e0f2fe' },
};

const STATUT_CFG: Record<string, { label: string; color: string }> = {
  EN_COURS: { label: 'En cours', color: '#d97706' },
  TRAITE:   { label: 'Traité',   color: '#16a34a' },
  CLASSE:   { label: 'Classé',   color: '#94a3b8' },
};

export default function DisciplinePage() {
  const [incidents, setIncidents] = useState<Incident[]>(STATIC_INCIDENTS);
  const [showModal, setShowModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [filterSanction, setFilterSanction] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [form, setForm] = useState({ eleve: '', classe: '', type: TYPE_INCIDENT[0], description: '', sanction: SANCTIONS[0].value, date: new Date().toISOString().split('T')[0] });

  const filtered = useMemo(() => {
    let list = incidents;
    if (filterStatut !== 'TOUS') list = list.filter((i) => i.statut === filterStatut);
    if (filterSanction !== 'TOUS') list = list.filter((i) => i.sanction === filterSanction);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.eleve.toLowerCase().includes(q) || i.classe.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  }, [incidents, filterStatut, filterSanction, search]);

  const handleCreate = () => {
    if (!form.eleve || !form.description) { toast.error('Élève et description requis'); return; }
    const newInc: Incident = { ...form, id: `i${Date.now()}`, statut: 'EN_COURS' };
    setIncidents((prev) => [newInc, ...prev]);
    toast.success('Incident enregistré');
    setShowModal(false);
    setForm({ eleve: '', classe: '', type: TYPE_INCIDENT[0], description: '', sanction: SANCTIONS[0].value, date: new Date().toISOString().split('T')[0] });
  };

  const handleClore = (id: string) => {
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, statut: 'TRAITE' } : i));
    toast.success('Incident clôturé');
  };

  const nbEnCours  = incidents.filter((i) => i.statut === 'EN_COURS').length;
  const nbTraites  = incidents.filter((i) => i.statut === 'TRAITE').length;
  const nbExclus   = incidents.filter((i) => i.sanction === 'EXCLUSION_TEMPORAIRE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Discipline & Sanctions</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{incidents.length} incidents enregistrés</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          + Signaler un incident
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En cours',          count: nbEnCours,         color: '#d97706', bg: '#fef3c7' },
          { label: 'Traités',           count: nbTraites,         color: '#16a34a', bg: '#dcfce7' },
          { label: 'Exclusions temp.', count: nbExclus,          color: '#7c3aed', bg: '#f3e8ff' },
          { label: 'Total incidents',   count: incidents.length,  color: '#0f172a', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher élève, classe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 200, boxSizing: 'border-box' }}
        />
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          style={{ height: 36, padding: '0 10px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
        >
          <option value="TOUS">Tous statuts</option>
          <option value="EN_COURS">En cours</option>
          <option value="TRAITE">Traité</option>
          <option value="CLASSE">Classé</option>
        </select>
        <select
          value={filterSanction}
          onChange={(e) => setFilterSanction(e.target.value)}
          style={{ height: 36, padding: '0 10px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
        >
          <option value="TOUS">Toutes sanctions</option>
          {SANCTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 90px 80px 1.5fr 130px 100px 110px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 820 }}>
            {['Élève', 'Classe', 'Date', 'Description', 'Sanction', 'Statut', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun incident trouvé</div>
          ) : filtered.map((inc, idx) => {
            const sc = SANCTION_CFG[inc.sanction] ?? { label: inc.sanction, color: '#475569', bg: '#f1f5f9' };
            const st = STATUT_CFG[inc.statut] ?? { label: inc.statut, color: '#475569' };
            return (
              <div key={inc.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 90px 80px 1.5fr 130px 100px 110px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 820 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{inc.eleve}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{inc.classe}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(inc.date).toLocaleDateString('fr-FR')}</span>
                <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 7px' }}>{sc.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{st.label}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setDetail(inc)}
                    style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Détail
                  </button>
                  {inc.statut === 'EN_COURS' && (
                    <button
                      onClick={() => handleClore(inc.id)}
                      style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Clore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Signaler incident */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Signaler un incident</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Élève *</label>
                  <input value={form.eleve} onChange={(e) => setForm((f) => ({ ...f, eleve: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe</label>
                  <input value={form.classe} onChange={(e) => setForm((f) => ({ ...f, classe: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type d'incident</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    {TYPE_INCIDENT.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Sanction proposée</label>
                <select value={form.sanction} onChange={(e) => setForm((f) => ({ ...f, sanction: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                  {SANCTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setShowModal(false)}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Détail incident</div>
            {[
              { label: 'Élève',       value: detail.eleve },
              { label: 'Classe',      value: detail.classe },
              { label: 'Date',        value: new Date(detail.date).toLocaleDateString('fr-FR') },
              { label: 'Type',        value: detail.type },
              { label: 'Sanction',    value: SANCTION_CFG[detail.sanction]?.label ?? detail.sanction },
              { label: 'Statut',      value: STATUT_CFG[detail.statut]?.label ?? detail.statut },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', width: 100, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Description</div>
              <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>{detail.description}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setDetail(null)}
                style={{ height: 38, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
