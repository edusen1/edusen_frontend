'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

type Permanence = {
  id: string;
  date: string;
  heure: string;
  classe: string;
  profAbsent: string;
  matiere: string;
  surveillant: string;
  salle: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  notes: string;
};

const STATIC_PERMANENCES: Permanence[] = [
  { id: 'p1', date: new Date().toISOString().split('T')[0], heure: '08:00-09:00', classe: '3ᵉ B', profAbsent: 'M. Diallo (Maths)', matiere: 'Mathématiques', surveillant: 'Surveillant 1', salle: 'Salle 12', statut: 'EN_COURS', notes: '' },
  { id: 'p2', date: new Date().toISOString().split('T')[0], heure: '10:00-11:00', classe: '5ᵉ A', profAbsent: 'Mme Ndiaye (Français)', matiere: 'Français', surveillant: 'Surveillant 2', salle: 'Salle 7', statut: 'PLANIFIEE', notes: 'Exercices page 45' },
  { id: 'p3', date: new Date().toISOString().split('T')[0], heure: '14:00-15:00', classe: '4ᵉ B', profAbsent: 'M. Traoré (Physique)', matiere: 'Physique-Chimie', surveillant: 'Surveillant 1', salle: 'Salle 3', statut: 'PLANIFIEE', notes: '' },
];

const STATUT_CFG = {
  PLANIFIEE: { label: 'Planifiée', color: '#2563eb', bg: '#eff6ff' },
  EN_COURS:  { label: 'En cours',  color: '#d97706', bg: '#fef3c7' },
  TERMINEE:  { label: 'Terminée',  color: '#16a34a', bg: '#dcfce7' },
  ANNULEE:   { label: 'Annulée',   color: '#dc2626', bg: '#fee2e2' },
};

export default function PermanencesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [permanences, setPermanences] = useState<Permanence[]>(STATIC_PERMANENCES);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [form, setForm] = useState<Omit<Permanence, 'id' | 'statut'>>({
    date: today, heure: '', classe: '', profAbsent: '', matiere: '', surveillant: '', salle: '', notes: '',
  });

  const filtered = useMemo(() => {
    let list = permanences.filter((p) => p.date === selectedDate);
    if (filterStatut !== 'TOUS') list = list.filter((p) => p.statut === filterStatut);
    return list;
  }, [permanences, selectedDate, filterStatut]);

  const nbEnCours  = permanences.filter((p) => p.date === selectedDate && p.statut === 'EN_COURS').length;
  const nbPlanif   = permanences.filter((p) => p.date === selectedDate && p.statut === 'PLANIFIEE').length;
  const nbTermines = permanences.filter((p) => p.date === selectedDate && p.statut === 'TERMINEE').length;

  const handleCreate = () => {
    if (!form.classe || !form.heure) { toast.error('Classe et horaire requis'); return; }
    const newP: Permanence = { ...form, id: `p${Date.now()}`, statut: 'PLANIFIEE' };
    setPermanences((prev) => [newP, ...prev]);
    toast.success('Permanence planifiée');
    setShowModal(false);
    setForm({ date: today, heure: '', classe: '', profAbsent: '', matiere: '', surveillant: '', salle: '', notes: '' });
  };

  const changeStatut = (id: string, statut: Permanence['statut']) => {
    setPermanences((prev) => prev.map((p) => p.id === id ? { ...p, statut } : p));
    toast.success('Statut mis à jour');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Permanences</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Gestion des remplacements et surveillances de salle</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ height: 38, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <button
            onClick={() => setShowModal(true)}
            style={{ height: 38, padding: '0 18px', border: 'none', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            + Planifier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En cours',     count: nbEnCours,               color: '#d97706', bg: '#fef3c7' },
          { label: 'Planifiées',   count: nbPlanif,                color: '#2563eb', bg: '#eff6ff' },
          { label: 'Terminées',    count: nbTermines,              color: '#16a34a', bg: '#dcfce7' },
          { label: "Aujourd'hui", count: filtered.length,          color: '#0f172a', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
        <div style={{ display: 'flex', border: '1px solid #e6ebf1', overflow: 'hidden', width: 'fit-content' }}>
          {(['TOUS', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              style={{ height: 36, padding: '0 14px', border: 'none', borderRight: '1px solid #e6ebf1', background: filterStatut === s ? '#d97706' : '#fff', color: filterStatut === s ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {s === 'TOUS' ? 'Toutes' : STATUT_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '40px 28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Aucune permanence pour cette date
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((p) => {
              const st = STATUT_CFG[p.statut];
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Time badge */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: 80 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{p.heure.split('-')[0]}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.heure.split('-')[1] ?? ''}</div>
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{p.classe}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 3 }}>
                      <strong>Prof absent :</strong> {p.profAbsent || '—'} &nbsp;|&nbsp; <strong>Matière :</strong> {p.matiere || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 3 }}>
                      <strong>Surveillant :</strong> {p.surveillant || '—'} &nbsp;|&nbsp; <strong>Salle :</strong> {p.salle || '—'}
                    </div>
                    {p.notes && <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>📝 {p.notes}</div>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    {p.statut === 'PLANIFIEE' && (
                      <button onClick={() => changeStatut(p.id, 'EN_COURS')}
                        style={{ fontSize: 11, fontWeight: 600, color: '#d97706', background: 'none', border: '1px solid #fcd34d', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Démarrer
                      </button>
                    )}
                    {p.statut === 'EN_COURS' && (
                      <button onClick={() => changeStatut(p.id, 'TERMINEE')}
                        style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Terminer
                      </button>
                    )}
                    {p.statut !== 'TERMINEE' && p.statut !== 'ANNULEE' && (
                      <button onClick={() => changeStatut(p.id, 'ANNULEE')}
                        style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Planifier permanence */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Planifier une permanence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Horaire *</label>
                  <input placeholder="08:00-09:00" value={form.heure} onChange={(e) => setForm((f) => ({ ...f, heure: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe *</label>
                  <input placeholder="3ᵉ B" value={form.classe} onChange={(e) => setForm((f) => ({ ...f, classe: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Salle</label>
                  <input placeholder="Salle 12" value={form.salle} onChange={(e) => setForm((f) => ({ ...f, salle: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Prof absent</label>
                  <input placeholder="M. Diallo (Maths)" value={form.profAbsent} onChange={(e) => setForm((f) => ({ ...f, profAbsent: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Matière</label>
                  <input placeholder="Mathématiques" value={form.matiere} onChange={(e) => setForm((f) => ({ ...f, matiere: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Surveillant assigné</label>
                <input placeholder="Nom du surveillant" value={form.surveillant} onChange={(e) => setForm((f) => ({ ...f, surveillant: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Notes / Consignes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Exercices à faire, consignes particulières…"
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setShowModal(false)}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
