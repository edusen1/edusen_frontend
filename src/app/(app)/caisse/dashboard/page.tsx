'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';

function fmtS(n: number) { if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k'; return String(n); }
function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function fmtD(v: string) { try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); } catch { return '—'; } }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

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

function Bar({ value, max, color, h = 8 }: { value: number; max: number; color: string; h?: number }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div style={{ background: '#f1f5f9', height: h, borderRadius: h / 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: h / 2 }} /></div>;
}

function Donut({ segments, size = 80 }: { segments: { value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>0</div>;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        {segments.filter((s) => s.value > 0).map((seg, i) => {
          const dash = c * (seg.value / total);
          const o = offset; offset += dash;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={10} strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-o} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{total}</div>
    </div>
  );
}

const TYPE_LABELS: R = { SCOLARITE: 'Scolarité', INSCRIPTION: 'Inscription', CANTINE: 'Cantine', TRANSPORT: 'Transport', AUTRE: 'Autre' };
const TYPE_COLORS: R = { SCOLARITE: '#2563eb', INSCRIPTION: '#7c3aed', CANTINE: '#16a34a', TRANSPORT: '#0891b2', AUTRE: '#64748b' };
const MODE_LABELS: R = { ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money', VIREMENT: 'Virement', CHEQUE: 'Chèque' };
const MODE_COLORS: R = { ESPECES: '#16a34a', MOBILE_MONEY: '#d97706', VIREMENT: '#2563eb', CHEQUE: '#7c3aed' };

export default function CaisseDashboardPage() {
  const [data, setData] = useState<R>({});
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('jour');

  useEffect(() => {
    setLoading(true);
    apiClient.get('/caisse/dashboard', { params: { periode } })
      .then((res) => setData((res.data && typeof res.data === 'object') ? res.data as R : {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [periode]);

  const todayCount = Number((data.today as R)?.count ?? 0);
  const todayMontant = Number((data.today as R)?.montant ?? 0);
  const monthCount = Number((data.month as R)?.count ?? 0);
  const monthMontant = Number((data.month as R)?.montant ?? 0);
  const attCount = Number((data.enAttente as R)?.count ?? 0);
  const attMontant = Number((data.enAttente as R)?.montant ?? 0);
  const rejCount = Number((data.rejete as R)?.count ?? 0);
  const totalEncaisse = Number(data.totalEncaisse ?? 0);
  const totalAll = Number(data.total ?? 0);
  const nbEleves = Number(data.nbEleves ?? 0);
  const txRec = pct(totalEncaisse, totalEncaisse + attMontant);

  const parType = Array.isArray(data.parType) ? data.parType as { type: string; count: number; montant: number }[] : [];
  const parMode = Array.isArray(data.parMode) ? data.parMode as { mode: string; count: number; montant: number }[] : [];
  const mensuel = Array.isArray(data.mensuel) ? data.mensuel as { mois: string; montant: number; count: number }[] : [];
  const derniersPaiements = Array.isArray(data.derniersPaiements) ? (data.derniersPaiements as R[]).slice(0, 6) : [];
  const isPersonal = Boolean(data.isPersonalView);
  const dettes = data.dettes as R | undefined;
  const montantDettes = Number(dettes?.montantTotal ?? 0);
  const nbDebiteurs = Number(dettes?.nbEleves ?? 0);

  const maxMensuel = mensuel.reduce((m, mo) => Math.max(m, mo.montant), 1);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tableau de bord — {isPersonal ? 'Mes activités' : 'Caisse'}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} style={{ height: 34, border: '1px solid #e6ebf1', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
            <option value="jour">Aujourd&apos;hui</option>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
            <option value="annee">Cette année</option>
            <option value="tout">Tout</option>
          </select>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{today}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: isPersonal ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
          <Kpi label={periode === 'jour' ? "Aujourd'hui" : periode === 'semaine' ? 'Cette semaine' : periode === 'mois' ? 'Ce mois' : periode === 'annee' ? 'Cette année' : 'Total'} value={fmtS(todayMontant)} color="#16a34a" sub={`${todayCount} transaction(s)`} />
          <Kpi label="Ce mois" value={fmtS(monthMontant)} color="#2563eb" sub={`${monthCount} transaction(s)`} />
          <Kpi label="En attente" value={fmtS(attMontant)} color="#d97706" sub={`${attCount} paiement(s)`} href="/caisse/paiements" />
          {!isPersonal && <Kpi label="Recouvrement" value={`${txRec}%`} color={txRec >= 75 ? '#16a34a' : txRec >= 50 ? '#d97706' : '#dc2626'} sub={fmt(totalEncaisse)} />}
          {!isPersonal && <Kpi label="Élèves" value={nbEleves} color="#0891b2" sub={nbDebiteurs > 0 ? `${nbDebiteurs} avec dettes` : undefined} />}
        </div>

        {/* Row 2 : 3 blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          {/* Par type */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Par type de paiement</div>
            {parType.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>—</div> : (
              <div style={{ display: 'flex', gap: 14 }}>
                <Donut segments={parType.map((t) => ({ value: t.montant, color: String(TYPE_COLORS[t.type] ?? '#64748b') }))} size={80} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {parType.map((t) => (
                    <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: String(TYPE_COLORS[t.type] ?? '#64748b'), flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#334155', flex: 1 }}>{String(TYPE_LABELS[t.type] ?? t.type)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{fmtS(t.montant)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Par mode */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Par mode de paiement</div>
            {parMode.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>—</div> : (
              <div style={{ display: 'flex', gap: 14 }}>
                <Donut segments={parMode.map((m) => ({ value: m.count, color: String(MODE_COLORS[m.mode] ?? '#64748b') }))} size={80} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {parMode.map((m) => (
                    <div key={m.mode} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: String(MODE_COLORS[m.mode] ?? '#64748b'), flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#334155', flex: 1 }}>{String(MODE_LABELS[m.mode] ?? m.mode)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Résumé */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{isPersonal ? 'Mon bilan' : 'Situation financière'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#f0fdf4', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{isPersonal ? 'Mes encaissements' : 'Total encaissé'}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{fmtS(totalEncaisse)}</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>En attente</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{fmtS(attMontant)}</div>
              </div>
              {!isPersonal && (
                <div style={{ background: '#fef2f2', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Dettes</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>{fmtS(montantDettes)}</div>
                  {nbDebiteurs > 0 && <div style={{ fontSize: 9, color: '#dc2626' }}>{nbDebiteurs} élève(s)</div>}
                </div>
              )}
              <div style={{ background: '#f8fafc', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Rejetés</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#64748b' }}>{rejCount}</div>
              </div>
            </div>
            {!isPersonal && (
              <div style={{ marginTop: 10 }}>
                <Bar value={totalEncaisse} max={totalEncaisse + attMontant} color="#16a34a" />
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{txRec}% recouvré · {totalAll} transaction(s) totales</div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3 : Encaissements mensuels */}
        {mensuel.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Encaissements — 6 derniers mois</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 110 }}>
              {mensuel.map((m, i) => {
                const h = maxMensuel > 0 ? Math.round((m.montant / maxMensuel) * 90) : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>{m.montant > 0 ? fmtS(m.montant) : ''}</div>
                    <div title={fmt(m.montant)} style={{ width: '100%', height: h, background: '#16a34a', borderRadius: '3px 3px 0 0', minHeight: m.montant > 0 ? 3 : 0 }} />
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{m.mois}</div>
                    <div style={{ fontSize: 8, color: '#cbd5e1' }}>{m.count} tx</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 4 : Derniers paiements + Accès rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Dernières transactions</div>
              <Link href="/caisse/historique" style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Tout voir</Link>
            </div>
            {derniersPaiements.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 20 }}>Aucune transaction</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${B}` }}>
                    {['Réf.', 'Type', 'Montant', 'Statut', 'Date'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {derniersPaiements.map((p, i) => {
                    const statut = String(p.statut ?? '');
                    const sc = statut === 'VALIDE' ? '#16a34a' : statut === 'EN_ATTENTE' ? '#d97706' : '#dc2626';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{String(p.reference ?? '—')}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: '#64748b' }}>{String(TYPE_LABELS[String(p.typePaiement)] ?? p.typePaiement ?? '')}</td>
                        <td style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{fmtS(Number(p.montant ?? 0))}</td>
                        <td style={{ padding: '6px 8px' }}><span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', background: sc + '18', color: sc }}>{statut}</span></td>
                        <td style={{ padding: '6px 8px', fontSize: 10, color: '#94a3b8' }}>{fmtD(String(p.datePaiement ?? p.createdAt ?? ''))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Accès rapides</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Nouvel encaissement', href: '/caisse/encaissement', color: '#16a34a' },
                { label: 'Paiements en attente', href: '/caisse/paiements', color: '#d97706' },
                { label: 'Historique complet', href: '/caisse/historique', color: '#2563eb' },
                { label: 'Inscriptions', href: '/caisse/inscriptions', color: '#7c3aed' },
                { label: 'Demande de réduction', href: '/admin/reductions', color: '#0891b2' },
              ].map((a) => (
                <Link key={a.label} href={a.href} style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: '10px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
