'use client';

import { useState } from 'react';
import { useProfesseurPaiements } from '@/hooks/use-query-api';
import { asArray } from '@/lib/api-data';

/**
 * Les six bulletins de salaire fictifs qui servaient de repli ont été retirés.
 * Ils affichaient 350 000 FCFA mensuels et un historique de paiements complet à
 * un enseignant qui n'a peut-être jamais été payé par la plateforme — la donnée
 * la plus sensible qu'on puisse inventer.
 */

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PAYE: { label: 'Payé', bg: '#dcfce7', color: '#16a34a' },
  payé: { label: 'Payé', bg: '#dcfce7', color: '#16a34a' },
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  en_attente: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  REJETE: { label: 'Rejeté', bg: '#fee2e2', color: '#dc2626' },
};

interface Paiement {
  id: string;
  reference: string;
  periode: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  heuresEffectuees: number;
  heuresDeduites: number;
  statut: string;
  datePaiement: string;
  mode: string;
  motifRejet: string;
}

export default function ProfesseurPaiementsPage() {
  const { data } = useProfesseurPaiements();
  const [detail, setDetail] = useState<Paiement | null>(null);

  const paiements: Paiement[] = asArray(data, 'paiements').map((p, i) => ({
    id: String(p.id ?? p._id ?? i),
    reference: String(p.reference ?? p.ref ?? `SAL-${i + 1}`),
    periode: String(p.periode ?? p.label ?? ''),
    dateDebut: String(p.dateDebut ?? ''),
    dateFin: String(p.dateFin ?? ''),
    montant: Number(p.montant ?? 0),
    heuresEffectuees: Number(p.heuresEffectuees ?? p.heures ?? 0),
    heuresDeduites: Number(p.heuresDeduites ?? 0),
    statut: String(p.statut ?? 'EN_ATTENTE'),
    datePaiement: String(p.datePaiement ?? p.date ?? ''),
    mode: String(p.mode ?? ''),
    motifRejet: String(p.motifRejet ?? ''),
  }));

  const totalPercu = paiements.filter((p) => p.statut === 'PAYE' || p.statut === 'payé').reduce((s, p) => s + p.montant, 0);
  const nbPaies = paiements.filter((p) => p.statut === 'PAYE' || p.statut === 'payé').length;
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const fd = (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Mes paiements</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Salaires — Année 2025–2026</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0' }}>
        <div style={{ background: '#0f172a', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total perçu cette année</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{fmt(totalPercu)}</div>
          </div>
          <div style={{ width: 1, height: 44, background: '#1e293b' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Paiements reçus</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{nbPaies} / {paiements.length}</div>
          </div>
          <div style={{ width: 1, height: 44, background: '#1e293b' }} />
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>En attente</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{paiements.filter((p) => p.statut === 'EN_ATTENTE' || p.statut === 'en_attente').length}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 160px 120px 110px 60px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 860 }}>
            {['Référence', 'Période', 'H. eff.', 'H. déd.', 'Montant', 'Date', 'Statut', ''].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {paiements.map((p, idx) => {
            const st = STATUT_MAP[p.statut] ?? STATUT_MAP.EN_ATTENTE;
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 80px 80px 160px 120px 110px 60px', padding: '13px 18px', borderBottom: idx < paiements.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 860 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>{p.reference}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.periode}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{p.heuresEffectuees}h</span>
                <span style={{ fontSize: 12, color: p.heuresDeduites > 0 ? '#dc2626' : '#64748b' }}>
                  {p.heuresDeduites > 0 ? `-${p.heuresDeduites}h` : '—'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(p.montant)}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{fd(p.datePaiement)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                <button onClick={() => setDetail(p)} style={{ height: 28, padding: '0 10px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Détail
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Détail du paiement</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>{detail.reference}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Période', value: detail.periode },
                { label: 'Statut', value: (STATUT_MAP[detail.statut] ?? STATUT_MAP.EN_ATTENTE).label },
                { label: 'Date début', value: fd(detail.dateDebut) },
                { label: 'Date fin', value: fd(detail.dateFin) },
                { label: 'Heures effectuées', value: `${detail.heuresEffectuees}h` },
                { label: 'Heures déduites', value: detail.heuresDeduites > 0 ? `-${detail.heuresDeduites}h` : '—' },
                { label: 'Montant', value: fmt(detail.montant) },
                { label: 'Mode', value: detail.mode || '—' },
                { label: 'Date paiement', value: fd(detail.datePaiement) },
              ].map((item) => (
                <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {detail.motifRejet && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Motif du rejet</div>
                <div style={{ fontSize: 13, color: '#7f1d1d' }}>{detail.motifRejet}</div>
              </div>
            )}

            <button onClick={() => setDetail(null)} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
