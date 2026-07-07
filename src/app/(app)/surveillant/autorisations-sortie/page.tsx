'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

type AutoSortie = {
  id: string;
  eleve: string;
  classe: string;
  date: string;
  heureSortie: string;
  heureRetour: string;
  motif: string;
  demandePar: 'PARENT' | 'ELEVE' | 'MEDECIN' | 'AUTRE';
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE' | 'SORTIE' | 'RETOUR';
  responsable: string;
  notes: string;
};

const STATIC_AUTORISATIONS: AutoSortie[] = [
  { id: 'a1', eleve: 'Moussa Diallo',   classe: '3ᵉ B', date: new Date().toISOString().split('T')[0], heureSortie: '10:30', heureRetour: '14:00', motif: 'Rendez-vous médical', demandePar: 'PARENT',  statut: 'APPROUVEE', responsable: 'Abdoulaye Diallo', notes: '' },
  { id: 'a2', eleve: 'Awa Cissé',       classe: '4ᵉ B', date: new Date().toISOString().split('T')[0], heureSortie: '11:00', heureRetour: '11:30', motif: 'Urgence familiale',   demandePar: 'PARENT',  statut: 'EN_ATTENTE', responsable: 'Aminata Cissé',   notes: '' },
  { id: 'a3', eleve: 'Ibrahima Fall',   classe: '5ᵉ A', date: new Date().toISOString().split('T')[0], heureSortie: '09:00', heureRetour: '12:00', motif: 'Compétition sportive', demandePar: 'AUTRE',  statut: 'SORTIE',    responsable: 'Coach Ndoye',     notes: 'Retour avant 12h' },
];

const STATUT_CFG = {
  EN_ATTENTE: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
  APPROUVEE:  { label: 'Approuvée',  color: '#16a34a', bg: '#dcfce7' },
  REFUSEE:    { label: 'Refusée',    color: '#dc2626', bg: '#fee2e2' },
  SORTIE:     { label: 'Sorti(e)',   color: '#2563eb', bg: '#eff6ff' },
  RETOUR:     { label: 'Retour',     color: '#16a34a', bg: '#dcfce7' },
};

const DEMANDE_CFG: Record<string, string> = {
  PARENT: 'Parent', ELEVE: 'Élève', MEDECIN: 'Médecin', AUTRE: 'Autre',
};

export default function AutorisationsSortiePage() {
  const today = new Date().toISOString().split('T')[0];
  const [list, setList] = useState<AutoSortie[]>(STATIC_AUTORISATIONS);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<AutoSortie, 'id' | 'statut'>>({
    eleve: '', classe: '', date: today, heureSortie: '', heureRetour: '', motif: '', demandePar: 'PARENT', responsable: '', notes: '',
  });

  const filtered = useMemo(() => {
    let data = list.filter((a) => a.date === selectedDate);
    if (filterStatut !== 'TOUS') data = data.filter((a) => a.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((a) => a.eleve.toLowerCase().includes(q) || a.classe.toLowerCase().includes(q) || a.motif.toLowerCase().includes(q));
    }
    return data;
  }, [list, selectedDate, filterStatut, search]);

  const nbAttente  = list.filter((a) => a.date === selectedDate && a.statut === 'EN_ATTENTE').length;
  const nbApprouv  = list.filter((a) => a.date === selectedDate && a.statut === 'APPROUVEE').length;
  const nbSortie   = list.filter((a) => a.date === selectedDate && a.statut === 'SORTIE').length;

  const updateStatut = (id: string, statut: AutoSortie['statut']) => {
    setList((prev) => prev.map((a) => a.id === id ? { ...a, statut } : a));
    const labels: Record<string, string> = { APPROUVEE: 'Autorisation approuvée', REFUSEE: 'Autorisation refusée', SORTIE: 'Sortie enregistrée', RETOUR: 'Retour enregistré' };
    toast.success(labels[statut] ?? 'Mis à jour');
  };

  const handleCreate = () => {
    if (!form.eleve || !form.motif || !form.heureSortie) { toast.error('Élève, motif et heure de sortie requis'); return; }
    const newA: AutoSortie = { ...form, id: `a${Date.now()}`, statut: 'EN_ATTENTE' };
    setList((prev) => [newA, ...prev]);
    toast.success('Demande enregistrée');
    setShowModal(false);
    setForm({ eleve: '', classe: '', date: today, heureSortie: '', heureRetour: '', motif: '', demandePar: 'PARENT', responsable: '', notes: '' });
  };

  const TABS = ['TOUS', 'EN_ATTENTE', 'APPROUVEE', 'SORTIE', 'RETOUR', 'REFUSEE'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Autorisations de sortie</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Billets de sortie et permissions exceptionnelles</div>
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
            style={{ height: 38, padding: '0 18px', border: 'none', background: '#0891b2', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            + Nouvelle demande
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente',  count: nbAttente, color: '#d97706', bg: '#fef3c7' },
          { label: 'Approuvées', count: nbApprouv, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Sortis',      count: nbSortie,  color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total',       count: list.filter((a) => a.date === selectedDate).length, color: '#0f172a', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher élève, motif…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 200, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', border: '1px solid #e6ebf1', overflow: 'hidden', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterStatut(t)}
              style={{ height: 36, padding: '0 12px', border: 'none', borderRight: '1px solid #e6ebf1', background: filterStatut === t ? '#0891b2' : '#fff', color: filterStatut === t ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {t === 'TOUS' ? 'Tous' : STATUT_CFG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 80px 80px 1.2fr 100px 150px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 780 }}>
            {['Élève / Classe', 'Sortie', 'Retour', 'Demande', 'Motif', 'Statut', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune autorisation pour cette date</div>
          ) : filtered.map((a, idx) => {
            const st = STATUT_CFG[a.statut];
            return (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 80px 80px 1.2fr 100px 150px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 780 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.eleve}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.classe}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{a.heureSortie}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{a.heureRetour || '—'}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{DEMANDE_CFG[a.demandePar] ?? a.demandePar}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{a.motif}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 7px' }}>{st.label}</span>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {a.statut === 'EN_ATTENTE' && (
                    <>
                      <button onClick={() => updateStatut(a.id, 'APPROUVEE')}
                        style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ✓ Approuver
                      </button>
                      <button onClick={() => updateStatut(a.id, 'REFUSEE')}
                        style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ✕ Refuser
                      </button>
                    </>
                  )}
                  {a.statut === 'APPROUVEE' && (
                    <button onClick={() => updateStatut(a.id, 'SORTIE')}
                      style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sortie ↗
                    </button>
                  )}
                  {a.statut === 'SORTIE' && (
                    <button onClick={() => updateStatut(a.id, 'RETOUR')}
                      style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Retour ↙
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouvelle demande de sortie</div>
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
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Heure sortie *</label>
                  <input type="time" value={form.heureSortie} onChange={(e) => setForm((f) => ({ ...f, heureSortie: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Heure retour</label>
                  <input type="time" value={form.heureRetour} onChange={(e) => setForm((f) => ({ ...f, heureRetour: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Demande par</label>
                <select value={form.demandePar} onChange={(e) => setForm((f) => ({ ...f, demandePar: e.target.value as AutoSortie['demandePar'] }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                  {Object.entries(DEMANDE_CFG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Responsable / Contact</label>
                <input value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif *</label>
                <textarea value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                  rows={2} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setShowModal(false)}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#0891b2', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
