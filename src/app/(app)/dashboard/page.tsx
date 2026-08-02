'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { useAdminStats, useAdminStatsMensuel } from '@/hooks/use-query-api';

// ─── Devise ───────────────────────────────────────────────────────────────────
function getDevise(): string {
  if (typeof window === 'undefined') return 'MRU';
  try {
    const p = localStorage.getItem('edusen_pays');
    const map: Record<string, string> = { SN: 'F CFA', ML: 'F CFA', GW: 'F CFA', CI: 'F CFA', BF: 'F CFA', NE: 'F CFA', TG: 'F CFA', BJ: 'F CFA', MR: 'MRU', GN: 'GNF', GM: 'GMD', SL: 'SLE', GH: 'GH₵', NG: '₦' };
    if (p && map[p]) return map[p];
  } catch { /* */ }
  return 'MRU';
}
function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' ' + getDevise();
}
function fmtM(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M ' + getDevise();
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k ' + getDevise();
  return fmt(n);
}

// ─── KPI Box ──────────────────────────────────────────────────────────────────
function KpiBox({ label, value, sub, color, loading }: { label: string; value: string | number; sub?: string; color: string; loading?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{label}</div>
      {loading
        ? <div style={{ height: 28, background: '#f1f5f9', borderRadius: 4, width: '60%', animation: 'pulse 1.5s infinite' }} />
        : <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      }
      {sub && !loading && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', margin: '24px 0 12px', paddingBottom: 6, borderBottom: '1px solid #e6ebf1' }}>
      {title}
    </div>
  );
}

// ─── Alertes config ───────────────────────────────────────────────────────────
type AlertType = 'danger' | 'warning' | 'info';
interface AlertItem { type: AlertType; texte: string; href: string }

const ALERTES_STATIC: AlertItem[] = [
  { type: 'danger',  texte: 'Classes sans professeur principal assigné',     href: '/admin/classes' },
  { type: 'danger',  texte: 'Élèves absents aujourd\'hui non justifiés',     href: '/admin/absences-eleves' },
  { type: 'danger',  texte: 'Cours non assuré ce matin (enseignant absent)', href: '/admin/personnel' },
  { type: 'warning', texte: 'Convocations disciplinaires en attente',        href: '/admin/discipline' },
  { type: 'warning', texte: 'Réclamations non traitées',                     href: '/admin/reclamations' },
  { type: 'warning', texte: 'Bulletins non générés pour le T3',              href: '/admin/bulletins' },
  { type: 'warning', texte: 'Professeurs sans cours dans l\'emploi du temps',href: '/admin/emplois-du-temps' },
  { type: 'info',    texte: 'Élèves débiteurs — paiements en retard',        href: '/admin/inscriptions' },
  { type: 'info',    texte: 'Notes manquantes signalées',                    href: '/admin/notes' },
  { type: 'info',    texte: 'Élèves sans parent/tuteur associé',             href: '/admin/eleves' },
];

const ALERTE_STYLE: Record<AlertType, { bg: string; border: string; dot: string; text: string }> = {
  danger:  { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#92400e' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#1e40af' },
};

// ─── Tooltip recharts ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#475569' }}>{p.name} :</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{fmtM(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PresenceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#475569' }}>{p.name} :</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: mensuel } = useAdminStatsMensuel({ annee: new Date().getFullYear().toString() });

  const s = (stats as Record<string, unknown>) ?? {};

  // KPIs depuis backend
  const totalEleves    = Number(s.totalEleves    ?? s.nbEleves       ?? 0);
  const totalClasses   = Number(s.totalClasses   ?? s.nbClasses      ?? 0);
  const totalProfs     = Number(s.totalProfesseurs ?? s.nbProfesseurs ?? 0);
  const totalPersonnel = Number(s.totalPersonnel ?? s.nbPersonnel    ?? 0);
  const presenceData   = (s.presenceAujourdhui as Record<string, number> | undefined) ?? {};
  const presents       = Number(presenceData.presents ?? s.presentsAujourdhui ?? 0);
  const absents        = Number(presenceData.absents  ?? s.absentsAujourdhui  ?? 0);
  const tauxPresence   = presents + absents > 0 ? Math.round((presents / (presents + absents)) * 100) : 0;
  const finances       = (s.finances as Record<string, number> | undefined) ?? {};
  const fraisAttendus  = Number(finances.fraisAttendus  ?? s.fraisAttendus  ?? 0);
  const fraisEncaisses = Number(finances.fraisEncaisses ?? s.fraisEncaisses ?? 0);
  const tauxRecouvrement = fraisAttendus > 0 ? Math.round((fraisEncaisses / fraisAttendus) * 100) : 0;
  const filles         = Number(s.totalFilles  ?? s.nbFilles  ?? 0);
  const garcons        = Number(s.totalGarcons ?? s.nbGarcons ?? 0);
  const retards        = Number(s.retardsAujourdhui ?? s.nbRetards ?? 0);
  const sanctions      = Number(s.sanctionsActives ?? 0);
  const profsAbsents   = Number(s.enseignantsAbsents ?? 0);

  // Chiffre d'affaires annuel
  const caAnnuel   = Number(s.chiffreAffairesAnnuel ?? fraisEncaisses);
  const caAttendu  = Number(s.chiffreAffairesAttendu ?? fraisAttendus);

  // Données mensuelles (recharts)
  const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const mensuelArr = Array.isArray(mensuel) ? mensuel : [];
  const chartFinancier = MOIS.map((mois, i) => {
    const found = mensuelArr.find((m: Record<string, unknown>) => Number(m.mois) === i + 1);
    return {
      mois,
      Encaissés: Number((found as Record<string, unknown> | undefined)?.encaissements ?? 0),
      Attendus:  Number((found as Record<string, unknown> | undefined)?.fraisAttendus  ?? 0),
    };
  });
  const chartPresence = MOIS.map((mois, i) => {
    const found = mensuelArr.find((m: Record<string, unknown>) => Number(m.mois) === i + 1);
    return {
      mois,
      'Taux présence (%)': Number((found as Record<string, unknown> | undefined)?.tauxPresence ?? 0),
    };
  });
  const hasFinancierData = chartFinancier.some(d => d.Encaissés > 0 || d.Attendus > 0);
  const hasPresenceData  = chartPresence.some(d => d['Taux présence (%)'] > 0);

  // Cycles
  const cyclesRaw = (s.repartitionCycles as Array<Record<string, unknown>> | undefined) ?? [];
  const cycles = cyclesRaw.length > 0 ? cyclesRaw.map(c => ({
    label: String(c.cycle ?? c.label ?? ''),
    nb: Number(c.nb ?? c.total ?? c.count ?? 0),
    color: String(c.color ?? '#2563eb'),
  })) : [];

  // Alertes dynamiques depuis stats
  const alertesDyn = (s.alertes as AlertItem[] | undefined) ?? ALERTES_STATIC;

  // État collapsible des groupes d'alertes
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({ danger: true, warning: true, info: false });
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const alertesDanger  = alertesDyn.filter((a, i) => a.type === 'danger'  && !dismissed.has(i));
  const alertesWarning = alertesDyn.filter((a, i) => a.type === 'warning' && !dismissed.has(i));
  const alertesInfo    = alertesDyn.filter((a, i) => a.type === 'info'    && !dismissed.has(i));
  const totalActives   = alertesDanger.length + alertesWarning.length + alertesInfo.length;

  function toggleGroup(g: string) {
    setGroupsOpen(prev => ({ ...prev, [g]: !prev[g] }));
  }

  function renderAlertGroup(
    key: string,
    items: AlertItem[],
    allItems: AlertItem[],
    label: string,
    dotColor: string,
    headerColor: string,
  ) {
    if (items.length === 0) return null;
    const open = groupsOpen[key];
    return (
      <div style={{ border: `1px solid ${ALERTE_STYLE[key as AlertType].border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <button
          onClick={() => toggleGroup(key)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: ALERTE_STYLE[key as AlertType].bg, border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: headerColor }}>{label} — {items.length} alerte(s)</span>
          <span style={{ fontSize: 16, color: '#94a3b8', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        {open && (
          <div style={{ background: '#fff' }}>
            {allItems.map((a, i) => {
              const globalIdx = alertesDyn.indexOf(a);
              if (a.type !== key || dismissed.has(globalIdx)) return null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: `1px solid ${ALERTE_STYLE[key as AlertType].border}` }}>
                  <span style={{ flex: 1, fontSize: 13, color: ALERTE_STYLE[key as AlertType].text }}>{a.texte}</span>
                  <a href={a.href} style={{ fontSize: 11, color: dotColor, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                    Voir →
                  </a>
                  <button
                    onClick={() => setDismissed(prev => new Set([...prev, globalIdx]))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tableau de bord</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Vue d&apos;ensemble — Année scolaire 2025-2026</div>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ padding: '20px 28px 0' }}>

        {/* ── ALERTES COLLAPSIBLES ── */}
        {totalActives > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Alertes — {totalActives} action(s) requise(s)
              </div>
              <button
                onClick={() => setGroupsOpen({ danger: true, warning: true, info: true })}
                style={{ background: 'none', border: 'none', fontSize: 11, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
              >
                Tout déplier
              </button>
            </div>
            {renderAlertGroup('danger',  alertesDanger,  alertesDyn, 'Urgences',        '#dc2626', '#991b1b')}
            {renderAlertGroup('warning', alertesWarning, alertesDyn, 'Avertissements',  '#d97706', '#92400e')}
            {renderAlertGroup('info',    alertesInfo,    alertesDyn, 'Informations',    '#2563eb', '#1e40af')}
          </div>
        )}

        {/* ── CHIFFRE D'AFFAIRES (résumé annuel) ── */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px', marginBottom: 4, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
              Chiffre d&apos;affaires annuel
            </div>
            {isLoading
              ? <div style={{ height: 30, background: '#f1f5f9', borderRadius: 4, width: '50%' }} />
              : <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{fmtM(caAnnuel)}</div>
            }
            {caAttendu > 0 && !isLoading && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>sur {fmtM(caAttendu)} attendus</div>
            )}
          </div>
          <div style={{ flex: 2, height: 6, background: '#f1f5f9', borderRadius: 3, position: 'relative' }}>
            <div style={{ height: '100%', borderRadius: 3, background: tauxRecouvrement >= 80 ? '#16a34a' : '#d97706', width: `${tauxRecouvrement}%`, transition: 'width .6s' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
              <span>0%</span>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Objectif ≥ 90%</span>
              <span>{tauxRecouvrement}% encaissé</span>
            </div>
          </div>
        </div>

        {/* ── GRAPHIQUE FINANCIER MENSUEL ── */}
        <SectionTitle title="Finances — Évolution mensuelle" />
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 18px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Encaissements vs Frais attendus ({new Date().getFullYear()})</span>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, background: '#16a34a', borderRadius: 2, display: 'inline-block' }} />Encaissés</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, background: '#e2e8f0', borderRadius: 2, display: 'inline-block' }} />Attendus</span>
            </div>
          </div>
          {!hasFinancierData && !isLoading
            ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                Données mensuelles indisponibles — configurez le backend <code>/v1/stats/mensuel</code>
              </div>
            )
            : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartFinancier} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtM(Number(v)).replace(' ' + getDevise(), '')} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Attendus"  fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Encaissés" fill="#16a34a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* KPIs financiers */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <KpiBox label="Frais attendus"   value={isLoading ? '…' : fmtM(fraisAttendus)} color="#0f172a" loading={isLoading} />
          <KpiBox label="Frais encaissés"  value={isLoading ? '…' : fmtM(fraisEncaisses)} color="#16a34a" loading={isLoading} />
          <KpiBox label="Taux recouvrement" value={isLoading ? '…' : tauxRecouvrement + '%'} color={tauxRecouvrement >= 80 ? '#16a34a' : '#d97706'} loading={isLoading} />
        </div>

        {/* ── GRAPHIQUE PRÉSENCES ── */}
        <SectionTitle title="Présences — Taux mensuel" />
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 18px', marginBottom: 4 }}>
          {!hasPresenceData && !isLoading
            ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                Données mensuelles de présence indisponibles
              </div>
            )
            : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartPresence} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<PresenceTooltip />} />
                  <Line type="monotone" dataKey="Taux présence (%)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* ── INDICATEURS ACADÉMIQUES ── */}
        <SectionTitle title="Indicateurs académiques" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <KpiBox label="Total élèves" value={isLoading ? '…' : totalEleves || '—'} sub={filles || garcons ? `${filles} filles · ${garcons} garçons` : undefined} color="#0f172a" loading={isLoading} />
          <KpiBox label="Classes actives" value={isLoading ? '…' : totalClasses || '—'} color="#2563eb" loading={isLoading} />
          <KpiBox label="Enseignants" value={isLoading ? '…' : totalProfs || '—'} color="#0369a1" loading={isLoading} />
          <KpiBox label="Personnel admin" value={isLoading ? '…' : totalPersonnel || '—'} color="#475569" loading={isLoading} />
        </div>

        {/* Cycles */}
        {cycles.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12 }}>Répartition par cycle</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {cycles.map(c => (
                <div key={c.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{c.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.nb}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9' }}>
                    <div style={{ height: '100%', background: c.color, width: `${totalEleves > 0 ? Math.round((c.nb / totalEleves) * 100) : 0}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                    {totalEleves > 0 ? Math.round((c.nb / totalEleves) * 100) : 0}% des élèves
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VIE SCOLAIRE ── */}
        <SectionTitle title="Vie scolaire — Aujourd'hui" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <KpiBox label="Présents"          value={isLoading ? '…' : presents || '—'} sub={tauxPresence ? `Taux ${tauxPresence}%` : undefined} color="#16a34a" loading={isLoading} />
          <KpiBox label="Absents"           value={isLoading ? '…' : absents  || '—'} sub="aujourd'hui" color="#dc2626" loading={isLoading} />
          <KpiBox label="Retards"           value={isLoading ? '…' : retards  || '—'} color="#d97706" loading={isLoading} />
          <KpiBox label="Sanctions actives" value={isLoading ? '…' : sanctions || '—'} color="#7c3aed" loading={isLoading} />
        </div>

        {/* ── PERSONNEL ── */}
        <SectionTitle title="Personnel" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <KpiBox label="Enseignants"        value={isLoading ? '…' : totalProfs || '—'} color="#0f172a" loading={isLoading} />
          <KpiBox label="Administratifs"     value={isLoading ? '…' : totalPersonnel || '—'} color="#475569" loading={isLoading} />
          <KpiBox label="Enseignants absents" value={isLoading ? '…' : profsAbsents || '—'} sub="aujourd'hui" color="#dc2626" loading={isLoading} />
        </div>

        {/* ── ACTIVITÉS ── */}
        <SectionTitle title="Activités" />
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: "Cours aujourd'hui", key: 'coursAujourdhui', color: '#2563eb' },
            { label: 'Examens à venir',   key: 'examensAVenir',   color: '#7c3aed' },
            { label: 'Devoirs en cours',  key: 'devoirsEnCours',  color: '#d97706' },
            { label: 'Événements',        key: 'evenements',      color: '#0369a1' },
          ].map(item => (
            <KpiBox
              key={item.key}
              label={item.label}
              value={isLoading ? '…' : (Number(s[item.key] ?? 0) || '—')}
              color={item.color}
              loading={isLoading}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
