'use client';

import { useCaissePaiements, useUpdateCaissePaiement } from '@/hooks/use-query-api';
import { classeLabel, formatDateFr, personLabel } from '@/lib/display';

/**
 * Paiements en attente de validation.
 *
 * Cette page affichait auparavant un jeu de données en dur (Moussa Diallo,
 * Fatou Sall, une classe « 5ème C » inexistante…) dès que l'API renvoyait une
 * liste vide. Un caissier voyait donc six paiements fictifs à valider.
 * On affiche désormais un état vide explicite — et une erreur reste une erreur.
 */
export default function CaissePaiementsPage() {
  const { data, isPending, isError, error, refetch } = useCaissePaiements({ statut: 'EN_ATTENTE' });
  const update = useUpdateCaissePaiement();

  const raw = (Array.isArray(data) ? data : (data?.paiements ?? data?.data ?? [])) as Record<string, unknown>[];

  const paiements = raw.map((p, i) => {
    const inscription = p.inscription as Record<string, unknown> | undefined;
    return {
      id: String(p.id ?? p._id ?? i),
      reference: String(p.reference ?? ''),
      eleve: personLabel(p.eleve ?? p.nomEleve ?? p.eleveName ?? ''),
      classe: classeLabel(inscription?.classe ?? p.classe, ''),
      type: String(p.typePaiement ?? p.type ?? ''),
      montant: Number(p.montant ?? 0),
      date: formatDateFr(p.datePaiement ?? p.date ?? p.createdAt),
      mode: String(p.modePaiement ?? p.mode ?? ''),
      statut: String(p.statut ?? 'EN_ATTENTE'),
    };
  });

  const total = paiements.reduce((s, p) => s + p.montant, 0);
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  const handleValider = (id: string) => update.mutate({ id, data: { statut: 'VALIDE' } });
  const handleRejeter = (id: string) => update.mutate({ id, data: { statut: 'REJETE' } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Paiements en attente</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {isPending ? 'Chargement…' : `${paiements.length} transaction(s) à valider`}
          </div>
        </div>
      </div>

      {/* Stats */}
      {!isError && (
        <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'En attente de validation', value: String(paiements.length), color: '#d97706' },
            { label: 'Montant total', value: fmt(total), color: '#2563eb' },
          ].map((s) => (
            <div key={s.label} style={{ flex: '1 1 200px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {/* Erreur — jamais confondue avec « aucun paiement » */}
        {isError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
              Impossible de charger les paiements
            </div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>
              {(error as { message?: string })?.message ?? 'Service temporairement indisponible.'}
            </div>
            <button
              onClick={() => refetch()}
              style={{ height: 32, padding: '0 14px', border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </div>
        )}

        {isPending && !isError && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Chargement des paiements…
          </div>
        )}

        {!isPending && !isError && (
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
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.classe || p.reference}</div>
                </div>
                <span style={{ fontSize: 12, color: '#475569' }}>{p.type}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', display: 'inline-block' }}>{p.mode}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{p.date}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(p.montant)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleValider(p.id)}
                    disabled={update.isPending}
                    style={{ height: 30, padding: '0 12px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: update.isPending ? 'not-allowed' : 'pointer', opacity: update.isPending ? 0.6 : 1 }}
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleRejeter(p.id)}
                    disabled={update.isPending}
                    style={{ height: 30, padding: '0 12px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: update.isPending ? 'not-allowed' : 'pointer', opacity: update.isPending ? 0.6 : 1 }}
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ))}

            {paiements.length === 0 && (
              <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Aucun paiement en attente</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Tous les paiements enregistrés ont été traités.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
