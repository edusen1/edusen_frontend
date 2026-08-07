'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminStats, useAdminStatsMensuel } from '@/hooks/use-query-api';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function fmtS(n: number) { if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k'; return String(n); }
function fmtD(v: string | Date) { try { return new Date(v as string).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); } catch { return '—'; } }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function Bar({ value, max, color, h = 8 }: { value: number; max: number; color: string; h?: number }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div style={{ background: '#f1f5f9', height: h, overflow: 'hidden' }}><div style={{ height: '100%', width: `${w}%`, background: color }} /></div>;
}

function Kpi({ label, value, sub, color, href }: { label: string; value: string | number; sub?: string; color: string; href?: string }) {
  const c = (
    <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', cursor: href ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{c}</Link> : c;
}

function Section({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{title}</div>
        {href && <Link href={href} style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>}
      </div>
      {children}
    </div>
  );
}

// Mini donut chart (SVG)
function Donut({ segments, size = 80 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>0</div>;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {visibleSegments.map((seg, i) => {
          const pctVal = seg.value / total;
          const dash = c * pctVal;
          const gap = c - dash;
          const offset = visibleSegments
            .slice(0, i)
            .reduce((sum, previous) => sum + c * (previous.value / total), 0);
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={10} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{total}</div>
    </div>
  );
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState(String(currentYear));
  const { data: statsRaw, isLoading } = useAdminStats();
  const { data: mensuelRaw } = useAdminStatsMensuel({ annee });

  const s: R = (statsRaw && typeof statsRaw === 'object' && !Array.isArray(statsRaw)) ? statsRaw as R : {};
  const mensuel: { mois: number; encaissements: number; fraisAttendus: number; absences: number; retards: number; tauxPresence: number }[] = Array.isArray(mensuelRaw) ? mensuelRaw : [];

  // Effectifs
  const eleves = Number(s.eleves ?? 0), profs = Number(s.professeurs ?? 0), personnels = Number(s.personnels ?? 0);
  const parents = Number(s.parents ?? 0), classes = Number(s.classes ?? 0), salles = Number(s.salles ?? 0);
  const inscActives = Number(s.inscriptionsActives ?? 0);
  const filles = Number(s.totalFilles ?? 0), garcons = Number(s.totalGarcons ?? 0);

  // Absences
  const absDuJour = Number(s.absencesDuJourEleves ?? 0), absTotal = Number(s.absencesEleves ?? 0);
  const retards = Number(s.retardsEleves ?? 0), absJust = Number(s.absencesJustifiees ?? 0);
  const absPersDuJour = Number(s.absencesDuJourPersonnel ?? 0);

  // Finances
  const montVal = Number(s.montantPaiements ?? 0), montAtt = Number(s.montantPaiementsEnAttente ?? 0);
  const paiAtt = Number(s.paiementsEnAttente ?? 0), paiVal = Number(s.paiementsValides ?? 0);
  const montTot = montVal + montAtt, txRec = pct(montVal, montTot);

  // Bulletins
  const bulVal = Number(s.bulletinsValides ?? 0), bulBr = Number(s.bulletinsBrouillons ?? 0);
  const moyNotes = Number(s.moyenneNotes ?? 0), nbNotes = Number(s.nombreNotes ?? 0);

  // Repartitions
  const rCycles = Array.isArray(s.repartitionCycles) ? s.repartitionCycles as { cycle: string; label: string; nb: number }[] : [];
  const eParClasse = Array.isArray(s.elevesParClasse) ? (s.elevesParClasse as { classeNom: string; eleves: number }[]).sort((a, b) => b.eleves - a.eleves).slice(0, 8) : [];
  const pParStat = Array.isArray(s.paiementsParStatut) ? s.paiementsParStatut as { statut: string; total: number; montant: number }[] : [];
  const aParStat = Array.isArray(s.absencesParStatut) ? s.absencesParStatut as { statut: string; total: number }[] : [];
  const bParStat = Array.isArray(s.bulletinsParStatut) ? s.bulletinsParStatut as { statut: string; total: number }[] : [];

  // Recent data
  const dernPai = Array.isArray(s.derniersPaiements) ? (s.derniersPaiements as R[]).slice(0, 5) : [];
  const absRec = Array.isArray(s.absencesRecentes) ? (s.absencesRecentes as R[]).slice(0, 5) : [];
  const alertes = Array.isArray(s.alertes) ? s.alertes as { type: string; texte: string; href?: string }[] : [];

  // Dettes
  const dettes = s.dettes as R | undefined;
  const montDettes = Number(dettes?.montantTotal ?? 0), nbDebiteurs = Number(dettes?.nbEleves ?? 0);

  // Tendances
  const maxEnc = mensuel.reduce((m, mo) => Math.max(m, mo.encaissements), 1);
  const maxAbs = mensuel.reduce((m, mo) => Math.max(m, mo.absences + mo.retards), 1);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tableau de bord</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{today}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={annee} onChange={(e) => setAnnee(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          {alertes.length > 0 && (
            <Link href="/admin/alertes" style={{ height: 34, padding: '0 12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              {alertes.length} alerte(s)
            </Link>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* Alertes danger */}
        {alertes.filter((a) => a.type === 'danger').map((a, i) => (
          <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#dc2626' }}>
            <span style={{ fontWeight: 800 }}>!!</span><span style={{ flex: 1 }}>{a.texte}</span>
            {a.href && <Link href={a.href} style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, textDecoration: 'none' }}>Voir</Link>}
          </div>
        ))}
        {alertes.filter((a) => a.type === 'danger').length > 0 && <div style={{ marginBottom: 10 }} />}

        {/* KPIs row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 14 }}>
          <Kpi label="Eleves" value={eleves} color="#2563eb" sub={`${filles}F / ${garcons}G`} href="/admin/eleves" />
          <Kpi label="Professeurs" value={profs} color="#7c3aed" href="/admin/professeurs" />
          <Kpi label="Classes" value={classes} color="#0891b2" sub={`${salles} salle(s)`} href="/admin/classes" />
          <Kpi label="Inscriptions" value={inscActives} color="#16a34a" sub="actives" href="/admin/inscriptions" />
          <Kpi label="Absences aujourd'hui" value={absDuJour} color={absDuJour > 0 ? '#dc2626' : '#16a34a'} sub={absPersDuJour > 0 ? `+ ${absPersDuJour} personnel` : undefined} href="/admin/absences-eleves" />
          <Kpi label="Recouvrement" value={`${txRec}%`} color={txRec >= 75 ? '#16a34a' : txRec >= 50 ? '#d97706' : '#dc2626'} sub={fmtS(montVal)} href="/admin/paiements" />
        </div>

        {/* Row 2 : 3 blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>

          {/* Finances */}
          <Section title="Finances" href="/admin/paiements">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <Donut segments={[
                { value: paiVal, color: '#16a34a', label: 'Validés' },
                { value: paiAtt, color: '#d97706', label: 'En attente' },
              ]} size={70} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Recouvré</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{fmtS(montVal)}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>En attente</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{fmtS(montAtt)}</div>
              </div>
            </div>
            <Bar value={montVal} max={montTot} color="#16a34a" />
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{fmt(montVal)} / {fmt(montTot)}</div>
            {nbDebiteurs > 0 && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>{nbDebiteurs} eleve(s) avec dettes ({fmtS(montDettes)})</div>}
          </Section>

          {/* Absences */}
          <Section title="Absences" href="/admin/absences-eleves">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <Donut segments={[
                { value: absJust, color: '#16a34a', label: 'Justifiées' },
                { value: absTotal - absJust, color: '#dc2626', label: 'Non justifiées' },
                { value: retards, color: '#d97706', label: 'Retards' },
              ]} size={70} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Total</div><div style={{ fontSize: 16, fontWeight: 800 }}>{absTotal}</div></div>
                <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Retards</div><div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{retards}</div></div>
                <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Justifiées</div><div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{absJust}</div></div>
                <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Non just.</div><div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{absTotal - absJust}</div></div>
              </div>
            </div>
            {absTotal > 0 && <><Bar value={absJust} max={absTotal} color="#16a34a" /><div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{pct(absJust, absTotal)}% justifiées</div></>}
          </Section>

          {/* Pédagogie */}
          <Section title="Pédagogie" href="/admin/bulletins">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <Donut segments={[
                { value: bulVal, color: '#16a34a', label: 'Validés' },
                { value: bulBr, color: '#d97706', label: 'Brouillons' },
              ]} size={70} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Bulletins validés</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{bulVal}</div>
                {bulBr > 0 && <><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>Brouillons</div><div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{bulBr}</div></>}
              </div>
            </div>
            {moyNotes > 0 && (
              <div style={{ background: '#f8fafc', padding: '8px 12px', marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Moyenne générale</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: moyNotes >= 10 ? '#16a34a' : '#dc2626' }}>{moyNotes.toFixed(2)}/20</div>
                {nbNotes > 0 && <div style={{ fontSize: 10, color: '#94a3b8' }}>{nbNotes} note(s) saisies</div>}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#64748b' }}>{personnels} personnel(s) · {parents} parent(s)</div>
          </Section>
        </div>

        {/* Row 3 : Tendances mensuelles */}
        {mensuel.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Encaissements */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Encaissements mensuels — {annee}</div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
                {mensuel.map((m, i) => {
                  const h = maxEnc > 0 ? Math.round((m.encaissements / maxEnc) * 88) : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{m.encaissements > 0 ? fmtS(m.encaissements) : ''}</div>
                      <div title={fmt(m.encaissements)} style={{ width: '100%', height: h, background: '#16a34a', minHeight: m.encaissements > 0 ? 2 : 0 }} />
                      <span style={{ fontSize: 8, color: '#94a3b8' }}>{MOIS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Absences + retards */}
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Absences & retards mensuels — {annee}</div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 100 }}>
                {mensuel.map((m, i) => {
                  const tot = m.absences + m.retards;
                  const h = maxAbs > 0 ? Math.round((tot / maxAbs) * 88) : 0;
                  const hAbs = tot > 0 ? Math.round((m.absences / tot) * h) : 0;
                  const hRet = h - hAbs;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>{tot > 0 ? tot : ''}</div>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: hAbs, background: '#dc2626', minHeight: m.absences > 0 ? 1 : 0 }} />
                        <div style={{ height: hRet, background: '#d97706', minHeight: m.retards > 0 ? 1 : 0 }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#94a3b8' }}>{MOIS[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: '#dc2626' }} /><span style={{ fontSize: 9, color: '#64748b' }}>Absences</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: '#d97706' }} /><span style={{ fontSize: 9, color: '#64748b' }}>Retards</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Row 4 : Taux de présence mensuel */}
        {mensuel.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Taux de présence mensuel — {annee}</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 60 }}>
              {mensuel.map((m, i) => {
                const h = Math.round((m.tauxPresence / 100) * 48);
                const color = m.tauxPresence >= 90 ? '#16a34a' : m.tauxPresence >= 70 ? '#d97706' : '#dc2626';
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ fontSize: 8, color, fontWeight: 700 }}>{m.tauxPresence > 0 ? `${m.tauxPresence}%` : ''}</div>
                    <div style={{ width: '100%', height: h, background: color, minHeight: m.tauxPresence > 0 ? 2 : 0 }} />
                    <span style={{ fontSize: 8, color: '#94a3b8' }}>{MOIS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 5 : Répartitions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Par cycle */}
          <Section title="Élèves par cycle">
            {rCycles.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>—</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rCycles.map((c) => (
                  <div key={c.cycle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>{c.label || c.cycle}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{c.nb}</span>
                    </div>
                    <Bar value={c.nb} max={rCycles.reduce((mx, c2) => Math.max(mx, c2.nb), 1)} color="#2563eb" />
                  </div>
                ))}
              </div>
            )}
            {(filles + garcons) > 0 && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#ec4899' }}>Filles — {filles} ({pct(filles, filles + garcons)}%)</span>
                  <span style={{ fontSize: 10, color: '#2563eb' }}>Garçons — {garcons}</span>
                </div>
                <div style={{ background: '#f1f5f9', height: 6, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', width: `${pct(filles, filles + garcons)}%`, background: '#ec4899' }} />
                  <div style={{ height: '100%', flex: 1, background: '#2563eb' }} />
                </div>
              </div>
            )}
          </Section>

          {/* Top classes */}
          <Section title="Top classes par effectif" href="/admin/classes">
            {eParClasse.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>—</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {eParClasse.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.classeNom}</span>
                      <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>{c.eleves}</span>
                    </div>
                    <Bar value={c.eleves} max={eParClasse[0]?.eleves ?? 1} color="#7c3aed" h={6} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Derniers paiements + absences recentes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title="Derniers paiements" href="/admin/paiements">
              {dernPai.length === 0 ? <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>—</div> : dernPai.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < dernPai.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#0f172a' }}>{String(p.reference ?? '—')}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{fmtD(String(p.datePaiement ?? p.createdAt ?? ''))}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.statut === 'VALIDE' ? '#16a34a' : '#d97706' }}>{fmtS(Number(p.montant ?? 0))}</div>
                </div>
              ))}
            </Section>
            <Section title="Absences récentes" href="/admin/absences-eleves">
              {absRec.length === 0 ? <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>—</div> : absRec.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < absRec.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#0f172a' }}>{String(a.classeNom ?? '—')}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{fmtD(String(a.date ?? ''))}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', background: a.typeAbsence === 'RETARD' ? '#fef3c7' : a.justifiee ? '#f0fdf4' : '#fef2f2', color: a.typeAbsence === 'RETARD' ? '#92400e' : a.justifiee ? '#16a34a' : '#dc2626' }}>
                    {a.typeAbsence === 'RETARD' ? 'Retard' : a.justifiee ? 'Just.' : 'Non just.'}
                  </span>
                </div>
              ))}
            </Section>
          </div>
        </div>

        {/* Accès rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { label: 'Nouvel élève', href: '/admin/eleves', color: '#2563eb' },
            { label: 'Inscription', href: '/admin/inscriptions', color: '#7c3aed' },
            { label: 'Paiement', href: '/admin/paiements', color: '#16a34a' },
            { label: 'Rapports & exports', href: '/admin/rapports', color: '#0891b2' },
            { label: 'Communication', href: '/admin/communication', color: '#d97706' },
          ].map((a) => (
            <Link key={a.label} href={a.href} style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
