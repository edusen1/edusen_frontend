'use client';

import { useAdminStats, useAdminRapports } from '@/hooks/use-query-api';

const STATIC_STATS = {
  eleves: 842,
  professeurs: 48,
  tauxPresence: 94.2,
  tauxRecouvrement: 78,
  nbClasses: 18,
  nbAbsences: 127,
  montantRecouvre: 38250000,
  montantAttendu: 49000000,
};

const RAPPORTS = [
  { id: 'r1', titre: 'Rapport de présence mensuel', description: 'Taux de présence par classe et par élève', categorie: 'Vie scolaire', icon: '📋' },
  { id: 'r2', titre: 'Bulletin de notes T2', description: 'Bulletins du 2ème trimestre tous élèves', categorie: 'Pédagogie', icon: '📊' },
  { id: 'r3', titre: 'Rapport financier', description: 'État du recouvrement des frais de scolarité', categorie: 'Finances', icon: '💰' },
  { id: 'r4', titre: 'Récapitulatif des inscriptions', description: 'Statistiques d\'inscriptions par classe', categorie: 'Gestion', icon: '📝' },
  { id: 'r5', titre: 'Rapport d\'activité professeurs', description: 'Présences et heures effectuées par professeur', categorie: 'Ressources Humaines', icon: '👥' },
  { id: 'r6', titre: 'Statistiques annuelles', description: 'Bilan complet de l\'année scolaire 2025–2026', categorie: 'Direction', icon: '📈' },
];

export default function RapportsPage() {
  const { data: statsData } = useAdminStats();
  const { data: rapportsData } = useAdminRapports();
  const stats = (statsData && typeof statsData === 'object') ? statsData as Record<string, unknown> : STATIC_STATS as Record<string, unknown>;
  const rawRapports = Array.isArray(rapportsData) ? rapportsData : (rapportsData?.rapports ?? rapportsData?.data ?? []);
  const rapportsList = (rawRapports as Record<string, unknown>[]).length > 0
    ? (rawRapports as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? r._id ?? Math.random()),
        titre: String(r.titre ?? r.title ?? r.nom ?? ''),
        description: String(r.description ?? ''),
        categorie: String(r.categorie ?? r.category ?? ''),
        icon: '📋',
      }))
    : RAPPORTS;

  const eleves = (stats.eleves ?? STATIC_STATS.eleves) as number;
  const profs = (stats.professeurs ?? STATIC_STATS.professeurs) as number;
  const tauxP = (stats.tauxPresence ?? STATIC_STATS.tauxPresence) as number;
  const tauxR = (stats.tauxRecouvrement ?? STATIC_STATS.tauxRecouvrement) as number;
  const montantR = (stats.montantRecouvre ?? STATIC_STATS.montantRecouvre) as number;
  const montantA = (stats.montantAttendu ?? STATIC_STATS.montantAttendu) as number;

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Rapports & statistiques</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Année scolaire 2025–2026</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Élèves inscrits', value: eleves, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Professeurs', value: profs, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Taux de présence', value: `${tauxP}%`, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Taux recouvrement', value: `${tauxR}%`, color: '#d97706', bg: '#fef3c7' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Finance summary */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20, marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Recouvrement financier</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Montant attendu</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{fmt(montantA)}</div></div>
            <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Montant recouvré</div><div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{fmt(montantR)}</div></div>
            <div><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Reste à recouvrer</div><div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{fmt(montantA - montantR)}</div></div>
          </div>
          <div style={{ background: '#f1f5f9', height: 10, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${tauxR}%`, background: '#16a34a' }} />
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{tauxR}% recouvré</div>
        </div>

        {/* Reports list */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Rapports disponibles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {rapportsList.map((r) => (
              <div key={r.id} style={{ border: '1px solid #e6ebf1', padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{r.titre}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{r.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '2px 8px' }}>{r.categorie}</span>
                    <button style={{ height: 28, padding: '0 12px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      Exporter PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
