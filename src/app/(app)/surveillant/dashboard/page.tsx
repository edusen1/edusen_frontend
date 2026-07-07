'use client';

import { useSurveillantAbsences, useSurveillantConvocations } from '@/hooks/use-query-api';

const today = new Date().toISOString().split('T')[0];

function fd(v: unknown): string {
  try { return new Date(String(v)).toLocaleDateString('fr-FR'); } catch { return String(v ?? '—'); }
}

export default function SurveillantDashboardPage() {
  const { data: absData } = useSurveillantAbsences();
  const { data: convData } = useSurveillantConvocations();

  const rawAbs = Array.isArray(absData) ? absData : (absData?.content ?? absData?.data ?? []) as Record<string, unknown>[];
  const rawConv = Array.isArray(convData) ? convData : (convData?.content ?? convData?.data ?? []) as Record<string, unknown>[];

  const absToday = rawAbs.filter((a) => String(a.date ?? a.createdAt ?? '').startsWith(today));
  const absEnAttente = rawAbs.filter((a) => !a.justifiee && a.statut !== 'APPROUVEE' && a.statut !== 'REJETEE');
  const absRetards = rawAbs.filter((a) => a.typeAbsence === 'RETARD');

  const convPlanifiees = rawConv.filter((c) => (c.statut ?? 'EN_ATTENTE') !== 'EFFECTUEE');
  const convAujourdHui = rawConv.filter((c) => {
    const d = String(c.dateConvocation ?? '');
    return d.startsWith(today);
  });

  const recentAbs = [...rawAbs].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))).slice(0, 6);
  const recentConv = [...rawConv].sort((a, b) => String(b.dateConvocation ?? '').localeCompare(String(a.dateConvocation ?? ''))).slice(0, 4);

  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Tableau de bord — Vie scolaire</div>
          <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{dateLabel}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Absences aujourd\'hui', value: absToday.length, sub: `${absEnAttente.length} en attente`, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Retards (total)', value: absRetards.length, sub: 'TypeAbsence = RETARD', color: '#d97706', bg: '#fef3c7' },
            { label: 'Convocations planifiées', value: convPlanifiees.length, sub: `${convAujourdHui.length} aujourd'hui`, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Total absences', value: rawAbs.length, sub: `${rawConv.length} convocations`, color: '#0f172a', bg: '#f8fafc' },
          ].map((k) => (
            <div key={k.label} style={{ flex: '1 1 180px', background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

          {/* Absences récentes */}
          <div style={{ flex: '1 1 340px', background: '#fff', border: '1px solid #e6ebf1' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Absences récentes</span>
              <a href="/surveillant/absences" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</a>
            </div>
            {recentAbs.length === 0 ? (
              <div style={{ padding: '28px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence enregistrée</div>
            ) : (
              recentAbs.map((a, idx) => {
                const type = String(a.typeAbsence ?? '');
                const isRetard = type === 'RETARD';
                const statut = String(a.statut ?? 'EN_ATTENTE');
                const badge = statut === 'APPROUVEE'
                  ? { color: '#16a34a', bg: '#dcfce7', label: 'Approuvée' }
                  : statut === 'REJETEE'
                  ? { color: '#dc2626', bg: '#fee2e2', label: 'Rejetée' }
                  : { color: '#d97706', bg: '#fef3c7', label: 'En attente' };
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: idx < recentAbs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 32, height: 32, background: isRetard ? '#fef3c7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isRetard ? '#d97706' : '#dc2626'} strokeWidth="2">
                        {isRetard ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> : <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isRetard ? 'Retard' : 'Absence'} — {fd(a.date)}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{String(a.motif ?? '—')}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 7px', flexShrink: 0 }}>{badge.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Convocations à venir */}
          <div style={{ flex: '1 1 280px', background: '#fff', border: '1px solid #e6ebf1' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Convocations</span>
              <a href="/surveillant/convocations" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</a>
            </div>
            {recentConv.length === 0 ? (
              <div style={{ padding: '28px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune convocation</div>
            ) : (
              recentConv.map((c, idx) => {
                const statut = String(c.statut ?? 'EN_ATTENTE');
                const badge = statut === 'EFFECTUEE'
                  ? { color: '#16a34a', bg: '#dcfce7', label: 'Effectuée' }
                  : { color: '#2563eb', bg: '#eff6ff', label: 'Planifiée' };
                return (
                  <div key={idx} style={{ padding: '12px 18px', borderBottom: idx < recentConv.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', flex: 1, marginRight: 8 }}>{String(c.motif ?? '—')}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 7px', flexShrink: 0 }}>{badge.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{fd(c.dateConvocation)}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modules en dev */}
          <div style={{ flex: '1 1 260px', background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Accès rapide</div>
            {[
              { label: 'Absences & Retards', href: '/surveillant/absences', color: '#dc2626', bg: '#fee2e2' },
              { label: 'Convocations', href: '/surveillant/convocations', color: '#2563eb', bg: '#eff6ff' },
              { label: 'Discipline & Sanctions', href: '/surveillant/discipline', color: '#7c3aed', bg: '#f3e8ff' },
              { label: 'Présences enseignants', href: '/surveillant/presences-enseignants', color: '#16a34a', bg: '#dcfce7' },
              { label: 'Permanences', href: '/surveillant/permanences', color: '#d97706', bg: '#fef3c7' },
              { label: 'Autorisations de sortie', href: '/surveillant/autorisations-sortie', color: '#0891b2', bg: '#e0f2fe' },
            ].map((item) => (
              <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}>
                <span style={{ width: 8, height: 8, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
              </a>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
