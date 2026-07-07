'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

type PresenceEns = {
  id: string;
  nom: string;
  prenom: string;
  matiere: string;
  heure: string;
  statut: 'PRESENT' | 'ABSENT' | 'RETARD';
  motif: string;
  date: string;
};

const STATIC_PRESENCES: PresenceEns[] = [
  { id: 'e1', prenom: 'Oumar',    nom: 'Diallo',  matiere: 'Mathématiques',    heure: '08:00', statut: 'PRESENT', motif: '',                      date: new Date().toISOString().split('T')[0] },
  { id: 'e2', prenom: 'Fatou',    nom: 'Ndiaye',  matiere: 'Français',         heure: '09:00', statut: 'ABSENT',  motif: 'Maladie',                date: new Date().toISOString().split('T')[0] },
  { id: 'e3', prenom: 'Mamadou',  nom: 'Sow',     matiere: 'Sciences Nat.',    heure: '10:00', statut: 'RETARD',  motif: 'Transport',              date: new Date().toISOString().split('T')[0] },
  { id: 'e4', prenom: 'Aissatou', nom: 'Ba',      matiere: 'Histoire-Géo',     heure: '11:00', statut: 'PRESENT', motif: '',                      date: new Date().toISOString().split('T')[0] },
  { id: 'e5', prenom: 'Ibrahima', nom: 'Traoré',  matiere: 'Physique-Chimie',  heure: '14:00', statut: 'ABSENT',  motif: 'Convocation administrative', date: new Date().toISOString().split('T')[0] },
];

const STATUT_CFG = {
  PRESENT: { label: 'Présent',  color: '#16a34a', bg: '#dcfce7', icon: '✓' },
  ABSENT:  { label: 'Absent',   color: '#dc2626', bg: '#fee2e2', icon: '✕' },
  RETARD:  { label: 'Retard',   color: '#d97706', bg: '#fef3c7', icon: '⏱' },
};

export default function PresencesEnseignantsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [presences, setPresences] = useState<PresenceEns[]>(STATIC_PRESENCES);
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [editModal, setEditModal] = useState<PresenceEns | null>(null);
  const [editForm, setEditForm] = useState<{ statut: PresenceEns['statut']; motif: string }>({ statut: 'PRESENT', motif: '' });

  const filtered = useMemo(() => {
    let list = presences.filter((p) => p.date === selectedDate);
    if (filterStatut !== 'TOUS') list = list.filter((p) => p.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => `${p.prenom} ${p.nom}`.toLowerCase().includes(q) || p.matiere.toLowerCase().includes(q));
    }
    return list;
  }, [presences, selectedDate, filterStatut, search]);

  const nbPresents = presences.filter((p) => p.date === selectedDate && p.statut === 'PRESENT').length;
  const nbAbsents  = presences.filter((p) => p.date === selectedDate && p.statut === 'ABSENT').length;
  const nbRetards  = presences.filter((p) => p.date === selectedDate && p.statut === 'RETARD').length;
  const total      = presences.filter((p) => p.date === selectedDate).length;

  const openEdit = (p: PresenceEns) => {
    setEditModal(p);
    setEditForm({ statut: p.statut, motif: p.motif });
  };

  const handleSave = () => {
    if (!editModal) return;
    if (editForm.statut !== 'PRESENT' && !editForm.motif.trim()) {
      toast.error('Motif requis pour absence ou retard');
      return;
    }
    setPresences((prev) => prev.map((p) => p.id === editModal.id ? { ...p, statut: editForm.statut, motif: editForm.motif } : p));
    toast.success('Présence mise à jour');
    setEditModal(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Présences enseignants</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Contrôle des présences — hors gestion salariale</div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ marginLeft: 'auto', height: 38, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Présents',    count: nbPresents, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Absents',     count: nbAbsents,  color: '#dc2626', bg: '#fee2e2' },
          { label: 'Retards',     count: nbRetards,  color: '#d97706', bg: '#fef3c7' },
          { label: 'Taux présence', count: total > 0 ? `${Math.round((nbPresents / total) * 100)}%` : '—', color: '#2563eb', bg: '#eff6ff' },
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
          placeholder="Rechercher enseignant, matière…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', border: '1px solid #e6ebf1', overflow: 'hidden' }}>
          {(['TOUS', 'PRESENT', 'ABSENT', 'RETARD'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              style={{ height: 36, padding: '0 12px', border: 'none', borderRight: '1px solid #e6ebf1', background: filterStatut === s ? '#2563eb' : '#fff', color: filterStatut === s ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {s === 'TOUS' ? 'Tous' : STATUT_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 80px 1fr 100px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 640 }}>
            {['Enseignant', 'Matière', 'Heure', 'Motif / Note', 'Statut'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun enseignant pour cette date</div>
          ) : filtered.map((p, idx) => {
            const st = STATUT_CFG[p.statut];
            return (
              <div
                key={p.id}
                onClick={() => openEdit(p)}
                style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 80px 1fr 100px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 640, cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.prenom} {p.nom}</div>
                </div>
                <span style={{ fontSize: 12, color: '#475569' }}>{p.matiere}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{p.heure}</span>
                <span style={{ fontSize: 12, color: '#64748b', fontStyle: p.motif ? 'normal' : 'italic' }}>{p.motif || '—'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 7px', display: 'inline-block' }}>
                  {st.icon} {st.label}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8' }}>Cliquez sur une ligne pour modifier le statut</div>
      </div>

      {/* Modal: Modifier présence */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 420, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Modifier présence</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{editModal.prenom} {editModal.nom} — {editModal.matiere} ({editModal.heure})</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Statut *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['PRESENT', 'ABSENT', 'RETARD'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditForm((f) => ({ ...f, statut: s }))}
                    style={{ flex: 1, height: 38, border: `2px solid ${editForm.statut === s ? STATUT_CFG[s].color : '#e6ebf1'}`, background: editForm.statut === s ? STATUT_CFG[s].bg : '#fff', color: editForm.statut === s ? STATUT_CFG[s].color : '#475569', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    {STATUT_CFG[s].icon} {STATUT_CFG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {editForm.statut !== 'PRESENT' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Motif *</label>
                <input
                  value={editForm.motif}
                  onChange={(e) => setEditForm((f) => ({ ...f, motif: e.target.value }))}
                  placeholder={editForm.statut === 'ABSENT' ? 'Maladie, convocation…' : 'Transport, urgence…'}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setEditModal(null)}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSave}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
