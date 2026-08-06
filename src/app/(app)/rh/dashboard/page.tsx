'use client';

import { formatDateFr, personLabel } from '@/lib/display';
import { useAdminPersonnel, useAdminAbsencesPersonnel, useAdminPointages } from '@/hooks/use-query-api';

const TYPE_COLORS: Record<string, string> = {
  PROFESSEUR: '#2563eb',
  SURVEILLANT: '#d97706',
  SECURITE: '#475569',
  COMPTABLE: '#16a34a',
  ASSISTANT: '#9333ea',
  DIRECTION: '#e11d48',
};

export default function RhDashboardPage() {
  const { data: personnelData } = useAdminPersonnel();
  const { data: absencesData } = useAdminAbsencesPersonnel();
  const { data: pointagesData } = useAdminPointages();

  const rawPersonnel = Array.isArray(personnelData) ? personnelData : (personnelData?.personnel ?? personnelData?.data ?? []) as Record<string, unknown>[];
  const rawAbsences = Array.isArray(absencesData) ? absencesData : (absencesData?.absences ?? absencesData?.data ?? []) as Record<string, unknown>[];
  const rawPointages = Array.isArray(pointagesData) ? pointagesData : (pointagesData?.pointages ?? pointagesData?.data ?? []) as Record<string, unknown>[];

  const today = new Date().toISOString().split('T')[0];

  const totalPersonnel = rawPersonnel.length;
  const actifs = rawPersonnel.filter((p) => (p.statut ?? 'actif') === 'actif').length;

  const absencesToday = rawAbsences.filter((a) => {
    const d = String(a.dateDebut ?? a.date ?? a.createdAt ?? '');
    return d.startsWith(today);
  }).length;

  const pointagesToday = rawPointages.filter((p) => {
    const d = String(p.date ?? p.createdAt ?? '');
    return d.startsWith(today);
  });
  const presents = pointagesToday.filter((p) => (p.statut ?? '').toString().toUpperCase() === 'PRESENT').length;
  const absentsToday = pointagesToday.filter((p) => (p.statut ?? '').toString().toUpperCase() === 'ABSENT').length;
  const retards = pointagesToday.filter((p) => (p.statut ?? '').toString().toUpperCase() === 'RETARD').length;
  const tauxPresence = pointagesToday.length > 0 ? Math.round((presents / pointagesToday.length) * 100) : 0;

  // Repartition par type
  const byType = rawPersonnel.reduce<Record<string, number>>((acc, p) => {
    const t = String(p.type ?? p.poste ?? 'AUTRE').toUpperCase();
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  // Absences en attente
  const enAttente = rawAbsences.filter((a) => a.statut === 'en_attente').length;

  // Recent absences
  const recentAbsences = [...rawAbsences].slice(0, 5) as Record<string, unknown>[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Tableau de bord RH</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Total personnel', value: totalPersonnel, sub: `${actifs} actifs`, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Absences du jour', value: absencesToday, sub: `${enAttente} en attente`, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Présents aujourd\'hui', value: presents, sub: `${retards} retard(s)`, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Taux de présence', value: `${tauxPresence}%`, sub: `${absentsToday} absent(s)`, color: '#d97706', bg: '#fef3c7' },
          ].map((k) => (
            <div key={k.label} style={{ flex: '1 1 180px', background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* Répartition personnel */}
          <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Répartition du personnel</div>
            {Object.entries(byType).length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Aucune donnée</div>
            ) : (
              Object.entries(byType).map(([type, count]) => {
                const pct = totalPersonnel > 0 ? Math.round((count / totalPersonnel) * 100) : 0;
                const color = TYPE_COLORS[type] ?? '#64748b';
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{type}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pointages du jour */}
          <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Pointages du jour</div>
            {pointagesToday.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Aucun pointage enregistré aujourd&apos;hui</div>
            ) : (
              pointagesToday.slice(0, 6).map((p, idx) => {
                const name = typeof p.personnel === 'string' ? p.personnel : String(p.personnel ?? `Personnel ${idx + 1}`);
                const statut = String(p.statut ?? 'PRESENT').toUpperCase();
                const statusStyle = statut === 'PRESENT' ? { bg: '#dcfce7', color: '#16a34a', label: 'Présent' }
                  : statut === 'ABSENT' ? { bg: '#fee2e2', color: '#dc2626', label: 'Absent' }
                  : statut === 'RETARD' ? { bg: '#fef3c7', color: '#d97706', label: 'Retard' }
                  : { bg: '#f3e8ff', color: '#7c3aed', label: statut };
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < Math.min(pointagesToday.length, 6) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 30, height: 30, background: '#0f172a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                      {name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {String(p.arrivee ?? p.heureArrivee ?? '—')} → {String(p.depart ?? p.heureDepart ?? '—')}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '2px 7px' }}>
                      {statusStyle.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Absences récentes */}
          <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Absences récentes</div>
            {recentAbsences.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Aucune absence enregistrée</div>
            ) : (
              recentAbsences.map((a, idx) => {
                // « Agent 1 », « Agent 2 »… venaient de ce repli : l'API renvoie
                // un objet personnel (firstName/lastName) que String() ne sait pas lire.
                const nom = personLabel(a.personnel ?? a.user ?? a, `Agent ${idx + 1}`);
                const statut = String(a.statut ?? 'en_attente');
                const statusStyle = statut === 'justifié' ? { bg: '#dcfce7', color: '#16a34a', label: 'Justifiée' }
                  : statut === 'non_justifié' ? { bg: '#fee2e2', color: '#dc2626', label: 'Non just.' }
                  : { bg: '#fef3c7', color: '#d97706', label: 'En attente' };
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < recentAbsences.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{nom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {formatDateFr(a.date ?? a.dateDebut)} · {String(a.motif ?? a.type ?? '—')}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, padding: '2px 7px' }}>
                      {statusStyle.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
