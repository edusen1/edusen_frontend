'use client';

import { useParentPaiements } from '@/hooks/use-query-api';

const STATIC_PAIEMENTS = [
  { id: 'p1', libelle: 'Scolarité T2', enfant: 'Moussa Diallo', montant: 75000, statut: 'a_payer', date: null },
  { id: 'p2', libelle: 'Scolarité T1', enfant: 'Moussa Diallo', montant: 75000, statut: 'paye', date: '01 Mar 2025' },
  { id: 'p3', libelle: 'Frais inscription', enfant: 'Moussa Diallo', montant: 25000, statut: 'paye', date: '15 Sep 2024' },
  { id: 'p4', libelle: 'Scolarité T2', enfant: 'Aminata Diallo', montant: 75000, statut: 'paye', date: '02 Mar 2025' },
];

export default function PaiementsParentPage() {
  const { data } = useParentPaiements();
  const rawList = Array.isArray(data) ? data : (data?.paiements ?? data?.echeances ?? []);
  const paiements = rawList.length > 0 ? rawList : STATIC_PAIEMENTS;

  const totalDu = (paiements as Record<string, unknown>[])
    .filter((p) => p.statut !== 'paye' && p.statut !== 'PAYE')
    .reduce((s, p) => s + ((p.montant as number) ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Paiements</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px' }}>

        {/* Balance due alert */}
        {totalDu > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 2 }}>Solde dû</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                {totalDu.toLocaleString('fr-FR')} <span style={{ fontSize: 14, fontWeight: 600 }}>FCFA</span>
              </div>
            </div>
            <button style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Payer
            </button>
          </div>
        )}

        {/* List label */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Échéances</div>

        {/* Payments list */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', marginBottom: 16 }}>
          {(paiements as Record<string, unknown>[]).map((p, idx) => {
            const statut = (p.statut ?? 'a_payer') as string;
            const isPaid = statut === 'paye' || statut === 'PAYE';
            const libelle = (p.libelle ?? p.description ?? 'Paiement') as string;
            const enfant = (p.enfant ?? '') as string;
            const montant = (p.montant ?? 0) as number;
            const date = (p.date ?? p.datePaiement ?? null) as string | null;

            return (
              <div
                key={(p.id as string) ?? idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  borderBottom: idx < paiements.length - 1 ? '1px solid #eef2f6' : 'none',
                  borderLeft: `3px solid ${isPaid ? '#16a34a' : '#dc2626'}`,
                }}
              >
                {/* Status icon */}
                <div style={{ width: 32, height: 32, background: isPaid ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isPaid ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{libelle}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {enfant}{enfant && date ? ' · ' : ''}{date ?? (isPaid ? '' : 'À régler')}
                  </div>
                </div>

                {/* Amount + badge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{montant.toLocaleString('fr-FR')} F</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isPaid ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                    {isPaid ? 'Payé' : 'À payer'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info box */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', display: 'flex', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 1.5 }}>
            Paiement accepté par <strong>Orange Money</strong>, <strong>Wave</strong> ou en <strong>espèces</strong> à l'administration.
          </div>
        </div>
      </div>
    </div>
  );
}
