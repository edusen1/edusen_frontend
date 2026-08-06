'use client';

import { useState } from 'react';
import { useCaissePaiements } from '@/hooks/use-query-api';
import { formatDateFr, personLabel } from '@/lib/display';

const STATIC_HISTORIQUE = [
  { id: 1, eleve: 'Moussa Diallo', type: 'Scolarité T3', montant: 120000, mode: 'Espèces', date: '2025-06-27', agent: 'Caissier A' },
  { id: 2, eleve: 'Fatou Sall', type: 'Inscription 2025', montant: 25000, mode: 'Wave', date: '2025-06-27', agent: 'Caissier A' },
  { id: 3, eleve: 'Aminata Diop', type: 'Scolarité T2', montant: 120000, mode: 'Orange Money', date: '2025-03-01', agent: 'Caissier B' },
  { id: 4, eleve: 'Ibrahima Ndiaye', type: 'Scolarité T2', montant: 150000, mode: 'Virement', date: '2025-02-28', agent: 'Caissier A' },
  { id: 5, eleve: 'Aissatou Ba', type: 'Frais examen', montant: 15000, mode: 'Espèces', date: '2025-06-15', agent: 'Caissier B' },
  { id: 6, eleve: 'Oumar Fall', type: 'Scolarité T1', montant: 110000, mode: 'Espèces', date: '2024-09-15', agent: 'Caissier A' },
  { id: 7, eleve: 'Rokhaya Sow', type: 'Scolarité T3', montant: 120000, mode: 'Wave', date: '2025-06-25', agent: 'Caissier A' },
  { id: 8, eleve: 'Mamadou Cissé', type: 'Fournitures', montant: 35000, mode: 'Espèces', date: '2025-06-20', agent: 'Caissier B' },
];

const MODE_COLORS: Record<string, { bg: string; color: string }> = {
  'Espèces': { bg: '#dcfce7', color: '#16a34a' },
  'Wave': { bg: '#eff6ff', color: '#2563eb' },
  'Orange Money': { bg: '#ffedd5', color: '#c2410c' },
  'Virement': { bg: '#f5f3ff', color: '#7c3aed' },
  'ESPECES': { bg: '#dcfce7', color: '#16a34a' },
  'MOBILE_MONEY': { bg: '#eff6ff', color: '#2563eb' },
  'VIREMENT': { bg: '#f5f3ff', color: '#7c3aed' },
};

export default function HistoriquePage() {
  const { data } = useCaissePaiements({ statut: 'VALIDE' });
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const raw = Array.isArray(data) ? data : (data?.paiements ?? data?.data ?? []);
  const historique = (raw as Record<string, unknown>[]).length > 0
    ? (raw as Record<string, unknown>[]).map((p, i) => ({
        id: String(p.id ?? p._id ?? i),
        // L'API renvoie un objet élève : `String(objet)` donnait « [object Object] ».
        eleve: personLabel(p.eleve ?? p.nomEleve ?? p.inscription ?? ''),
        type: String(p.type ?? p.typePaiement ?? ''),
        montant: Number(p.montant ?? 0),
        mode: String(p.mode ?? p.modePaiement ?? ''),
        date: String(p.datePaiement ?? p.date ?? p.createdAt ?? ''),
        agent: personLabel(p.agent ?? p.agentCaisse ?? p.creePar ?? ''),
      }))
    : STATIC_HISTORIQUE;

  const filtered = historique.filter((p) => {
    const matchSearch = !search || p.eleve.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase());
    const matchMode = !filterMode || p.mode === filterMode;
    const matchDateDebut = !dateDebut || p.date >= dateDebut;
    const matchDateFin = !dateFin || p.date <= dateFin;
    return matchSearch && matchMode && matchDateDebut && matchDateFin;
  });

  // Le mois courant était figé sur « 2025-06 » : l'écran annonçait « Ce mois (Juin) »
  // quelle que soit la date réelle. On le dérive maintenant de la date du jour.
  const maintenant = new Date();
  const moisCourant = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
  const moisCourantLabel = maintenant.toLocaleDateString('fr-FR', { month: 'long' });
  const totalMois = filtered
    .filter((p) => {
      const d = new Date(p.date);
      if (Number.isNaN(d.getTime())) return p.date.startsWith(moisCourant);
      return d.getFullYear() === maintenant.getFullYear() && d.getMonth() === maintenant.getMonth();
    })
    .reduce((s, p) => s + p.montant, 0);
  const totalGeneral = filtered.reduce((s, p) => s + p.montant, 0);
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const fd = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; } };

  const exportCSV = () => {
    const rows = [['Élève', 'Type', 'Montant', 'Mode', 'Date', 'Agent']];
    filtered.forEach((p) => rows.push([p.eleve, p.type, String(p.montant), p.mode, p.date, p.agent]));
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'historique.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Historique paiements</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Toutes les transactions validées</div>
        </div>
        <button onClick={exportCSV} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: `Ce mois (${moisCourantLabel})`, value: fmt(totalMois), color: '#16a34a', bg: '#dcfce7' },
          { label: 'Total filtré', value: fmt(totalGeneral), color: '#2563eb', bg: '#eff6ff' },
          { label: 'Transactions', value: filtered.length, color: '#0f172a', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 150px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: '1 1 200px', maxWidth: 280 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher élève, type…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
          <option value="">Tous modes</option>
          <option value="Espèces">Espèces</option>
          <option value="Wave">Wave</option>
          <option value="Orange Money">Orange Money</option>
          <option value="Virement">Virement</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 120px 110px 130px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 680 }}>
            {['Élève', 'Type', 'Mode', 'Agent', 'Date', 'Montant'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((p, idx) => {
            const mc = MODE_COLORS[p.mode] ?? { bg: '#f1f5f9', color: '#475569' };
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 120px 110px 130px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 680 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.eleve}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{p.type}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: mc.color, background: mc.bg, padding: '2px 8px', display: 'inline-block' }}>{p.mode}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{p.agent}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{fd(p.date)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(p.montant)}</span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune transaction trouvée</div>
          )}
        </div>
      </div>
    </div>
  );
}
