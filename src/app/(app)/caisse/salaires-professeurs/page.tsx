'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const STATIC_SALAIRES = [
  { id: 's1', nom: 'Mamadou Diallo', matiere: 'Mathématiques', salaire: 350000, mois: 'Janvier 2026', statut: 'payé', date: '31/01/2026' },
  { id: 's2', nom: 'Aminata Sarr', matiere: 'Français', salaire: 320000, mois: 'Janvier 2026', statut: 'payé', date: '31/01/2026' },
  { id: 's3', nom: 'Ibrahima Ndiaye', matiere: 'Histoire-Géo', salaire: 310000, mois: 'Janvier 2026', statut: 'en_attente', date: '—' },
  { id: 's4', nom: 'Fatou Fall', matiere: 'SVT', salaire: 300000, mois: 'Janvier 2026', statut: 'en_attente', date: '—' },
  { id: 's5', nom: 'Cheikh Bâ', matiere: 'Physique-Chimie', salaire: 330000, mois: 'Janvier 2026', statut: 'en_attente', date: '—' },
  { id: 's6', nom: 'Mariama Cissé', matiere: 'Anglais', salaire: 290000, mois: 'Janvier 2026', statut: 'payé', date: '30/01/2026' },
];

const MOIS_OPTIONS = ['Janvier 2026', 'Décembre 2025', 'Novembre 2025', 'Octobre 2025', 'Septembre 2025'];

export default function SalairesProfesseursPage() {
  const [selectedMois, setSelectedMois] = useState('Janvier 2026');

  const totalSalaires = STATIC_SALAIRES.reduce((sum, s) => sum + s.salaire, 0);
  const totalPaye = STATIC_SALAIRES.filter((s) => s.statut === 'payé').reduce((sum, s) => sum + s.salaire, 0);
  const nbPaye = STATIC_SALAIRES.filter((s) => s.statut === 'payé').length;

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  const handlePayer = (id: string, nom: string) => {
    toast.success(`Salaire de ${nom} marqué comme payé`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Salaires professeurs</div>
        <select value={selectedMois} onChange={(e) => setSelectedMois(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', cursor: 'pointer' }}>
          {MOIS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={() => toast.success('Export PDF généré')} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Exporter
        </button>
        <button onClick={() => toast.success('Paiement groupé initié')} style={{ height: 38, padding: '0 18px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Payer tout
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Masse salariale', value: fmt(totalSalaires), color: '#0f172a', bg: '#f8fafc' },
          { label: 'Déjà versé', value: fmt(totalPaye), color: '#16a34a', bg: '#dcfce7' },
          { label: 'Reste à payer', value: fmt(totalSalaires - totalPaye), color: '#dc2626', bg: '#fee2e2' },
          { label: 'Payés / Total', value: `${nbPaye} / ${STATIC_SALAIRES.length}`, color: '#2563eb', bg: '#eff6ff' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 150px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 130px 130px 100px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 720 }}>
            {['Professeur', 'Matière', 'Salaire', 'Statut', 'Date paiement', 'Action'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {STATIC_SALAIRES.map((s, idx) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 130px 130px 100px', padding: '12px 18px', borderBottom: idx < STATIC_SALAIRES.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 720 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {s.nom.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.nom}</span>
              </div>
              <span style={{ fontSize: 12, color: '#475569' }}>{s.matiere}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(s.salaire)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.statut === 'payé' ? '#16a34a' : '#d97706', background: s.statut === 'payé' ? '#dcfce7' : '#fef3c7', padding: '3px 8px', display: 'inline-block' }}>
                {s.statut === 'payé' ? 'Payé' : 'En attente'}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{s.date}</span>
              {s.statut === 'en_attente' ? (
                <button onClick={() => handlePayer(s.id, s.nom)} style={{ height: 28, padding: '0 12px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Payer</button>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>—</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
