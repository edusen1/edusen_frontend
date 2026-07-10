'use client';

import { useCaissePaiements, useUpdateCaissePaiement } from '@/hooks/use-query-api';
import { classeLabel } from '@/lib/display';

const STATIC_PAIEMENTS = [
  { id: 1, eleve: 'Moussa Diallo', classe: '3ème B', type: 'Scolarité T3', montant: 120000, date: '27 Jun 2025', mode: 'Espèces', statut: 'EN_ATTENTE' },
  { id: 2, eleve: 'Fatou Sall', classe: '6ème A', type: 'Inscription 2025', montant: 25000, date: '27 Jun 2025', mode: 'Wave', statut: 'EN_ATTENTE' },
  { id: 3, eleve: 'Aminata Diop', classe: '4ème B', type: 'Scolarité T3', montant: 120000, date: '27 Jun 2025', mode: 'Orange Money', statut: 'EN_ATTENTE' },
  { id: 4, eleve: 'Ibrahima Ndiaye', classe: '2nde A', type: 'Frais examen BFEM', montant: 15000, date: '26 Jun 2025', mode: 'Espèces', statut: 'EN_ATTENTE' },
  { id: 5, eleve: 'Aissatou Ba', classe: '5ème C', type: 'Scolarité T3', montant: 110000, date: '26 Jun 2025', mode: 'Virement', statut: 'EN_ATTENTE' },
  { id: 6, eleve: 'Oumar Fall', classe: '3ème B', type: 'Fournitures', montant: 35000, date: '25 Jun 2025', mode: 'Espèces', statut: 'EN_ATTENTE' },
];

export default function CaissePaiementsPage() {
  const { data } = useCaissePaiements({ statut: 'EN_ATTENTE' });
  const update = useUpdateCaissePaiement();

  const raw = Array.isArray(data) ? data : (data?.paiements ?? data?.data ?? []);
  const paiements = (raw as Record<string, unknown>[]).length > 0
    ? (raw as Record<string, unknown>[]).map((p, i) => ({
        id: String(p.id ?? p._id ?? i),
        eleve: String(p.eleve ?? p.nomEleve ?? p.eleveName ?? ''),
        classe: classeLabel(p.classe, ''),
        type: String(p.type ?? p.typePaiement ?? ''),
        montant: Number(p.montant ?? 0),
        date: String(p.date ?? p.datePaiement ?? p.createdAt ?? ''),
        mode: String(p.mode ?? p.modePaiement ?? ''),
        statut: String(p.statut ?? 'EN_ATTENTE'),
      }))
    : STATIC_PAIEMENTS;

  const total = paiements.reduce((s, p) => s + p.montant, 0);
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  const handleValider = (id: string | number) => {
    update.mutate({ id: String(id), data: { statut: 'VALIDE' } });
  };
  const handleRejeter = (id: string | number) => {
    update.mutate({ id: String(id), data: { statut: 'REJETE' } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Paiements en attente</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{paiements.length} transaction(s) à valider</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente de validation', value: paiements.length, color: '#d97706', bg: '#fef3c7' },
          { label: 'Montant total', value: fmt(total), color: '#2563eb', bg: '#eff6ff' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 200px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px 130px 170px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 720 }}>
            {['Élève', 'Type', 'Mode', 'Date', 'Montant', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {paiements.map((p, idx) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px 130px 170px', padding: '12px 18px', borderBottom: idx < paiements.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 720 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.eleve}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.classe}</div>
              </div>
              <span style={{ fontSize: 12, color: '#475569' }}>{p.type}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', display: 'inline-block' }}>{p.mode}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{p.date}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(p.montant)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleValider(p.id)}
                  disabled={update.isPending}
                  style={{ height: 30, padding: '0 12px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Valider
                </button>
                <button
                  onClick={() => handleRejeter(p.id)}
                  disabled={update.isPending}
                  style={{ height: 30, padding: '0 12px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
          {paiements.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun paiement en attente</div>
          )}
        </div>
      </div>
    </div>
  );
}
