'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TRANCHES = [
  { label: '08h-09h', debut: '08:00', fin: '09:00' },
  { label: '09h-10h', debut: '09:00', fin: '10:00' },
  { label: '10h-11h', debut: '10:00', fin: '11:00' },
  { label: '11h-12h', debut: '11:00', fin: '12:00' },
  { label: '12h-13h', debut: '12:00', fin: '13:00' },
  { label: '13h-14h', debut: '13:00', fin: '14:00' },
  { label: '14h-15h', debut: '14:00', fin: '15:00' },
  { label: '15h-16h', debut: '15:00', fin: '16:00' },
  { label: '16h-17h', debut: '16:00', fin: '17:00' },
  { label: '17h-18h', debut: '17:00', fin: '18:00' },
  { label: '18h-19h', debut: '18:00', fin: '19:00' },
];

const MATIERE_COLORS = [
  { border: '#2563eb', bg: '#eff6ff', text: '#1d4ed8' },
  { border: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9' },
  { border: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  { border: '#d97706', bg: '#fef3c7', text: '#b45309' },
  { border: '#dc2626', bg: '#fee2e2', text: '#b91c1c' },
  { border: '#0891b2', bg: '#ecfeff', text: '#0e7490' },
  { border: '#4f46e5', bg: '#eef2ff', text: '#4338ca' },
  { border: '#be185d', bg: '#fdf2f8', text: '#9d174d' },
];

interface Creneau {
  id: string; jour: string; heureDebut: string; heureFin: string;
  matiere: string; matiereId: string; classe: string; classeId: string; salle: string;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function EmploiDuTempsEnseignant() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState('');
  const [filterSalle, setFilterSalle] = useState('');
  const [detail, setDetail] = useState<Creneau | null>(null);
  const isMobile = useIsMobile();

  // Mobile: selected day
  const now = new Date();
  const todayIdx = now.getDay() >= 1 && now.getDay() <= 6 ? now.getDay() - 1 : 0;
  const [mobileDay, setMobileDay] = useState(todayIdx);
  const nowDay = JOURS[todayIdx] ?? '';
  const nowHeure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const fetchEdt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/professeur/emploi-du-temps');
      const data = Array.isArray(res.data) ? res.data : ((res.data as R)?.data ?? (res.data as R)?.content ?? []);
      setCreneaux((data as R[]).map((c) => ({
        id: String(c.id ?? ''),
        jour: String(c.jourSemaine ?? 'Lundi'),
        heureDebut: String(c.heureDebut ?? '08:00').padStart(5, '0'),
        heureFin: String(c.heureFin ?? '09:00').padStart(5, '0'),
        matiere: String(c.matiereLibelle ?? c.matiereCode ?? ''),
        matiereId: String(c.matiereId ?? ''),
        classe: String(c.classeNom ?? ''),
        classeId: String(c.classeId ?? ''),
        salle: String(c.salleNom ?? ''),
      })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchEdt(); }, [fetchEdt]);

  const classes = [...new Map(creneaux.map((c) => [c.classeId, c.classe])).entries()].filter(([, n]) => n);
  const salles = [...new Set(creneaux.map((c) => c.salle))].filter(Boolean);

  const filtered = creneaux.filter((c) => {
    if (filterClasse && c.classeId !== filterClasse) return false;
    if (filterSalle && c.salle !== filterSalle) return false;
    return true;
  });

  const matieresUniques = [...new Set(filtered.map((c) => c.matiereId))];
  const matiereColorMap = new Map(matieresUniques.map((m, i) => [m, MATIERE_COLORS[i % MATIERE_COLORS.length]]));

  function trancheIdx(h: string): number {
    const hh = parseInt(h.split(':')[0] ?? '0');
    return TRANCHES.findIndex((t) => parseInt(t.debut.split(':')[0]) === hh);
  }

  function getRowSpan(c: Creneau): number {
    const s = trancheIdx(c.heureDebut);
    const e = trancheIdx(c.heureFin);
    return e > s ? e - s : 1;
  }

  function getCreneauxStart(jour: string, trancheDebut: string): Creneau[] {
    return filtered.filter((c) => {
      if (c.jour !== jour) return false;
      return parseInt(c.heureDebut.split(':')[0] ?? '0') === parseInt(trancheDebut.split(':')[0] ?? '0');
    });
  }

  function isTrancheCouverte(jour: string, trancheIndex: number): boolean {
    return filtered.some((c) => {
      if (c.jour !== jour) return false;
      const s = trancheIdx(c.heureDebut);
      const span = getRowSpan(c);
      return trancheIndex > s && trancheIndex < s + span;
    });
  }

  const totalHeures = filtered.reduce((s, c) => s + Math.max(0, parseInt(c.heureFin.split(':')[0] ?? '0') - parseInt(c.heureDebut.split(':')[0] ?? '0')), 0);

  // ── MOBILE VIEW ──
  if (isMobile) {
    const dayName = JOURS[mobileDay];
    const dayCours = filtered.filter((c) => c.jour === dayName).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
        {/* Header mobile */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Mon emploi du temps</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{totalHeures}h/sem · {filtered.length} créneau(x)</div>
        </div>

        {/* Day selector */}
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, display: 'flex', padding: '0 8px', overflowX: 'auto' }}>
          {JOURS.map((j, ji) => {
            const nbCours = filtered.filter((c) => c.jour === j).length;
            return (
              <button key={j} onClick={() => setMobileDay(ji)}
                style={{ flex: '0 0 auto', height: 44, padding: '0 14px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: mobileDay === ji ? 700 : 400, color: mobileDay === ji ? '#2563eb' : j === nowDay ? '#0f172a' : '#64748b', borderBottom: mobileDay === ji ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
                {j.slice(0, 3)}
                {nbCours > 0 && <span style={{ position: 'absolute', top: 6, right: 4, width: 6, height: 6, borderRadius: '50%', background: mobileDay === ji ? '#2563eb' : '#94a3b8' }} />}
              </button>
            );
          })}
        </div>

        {/* Filters mobile */}
        <div style={{ flexShrink: 0, padding: '8px 16px', display: 'flex', gap: 6 }}>
          <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ flex: 1, height: 32, border: `1px solid ${B}`, padding: '0 8px', fontSize: 11, fontFamily: 'inherit', background: '#fff' }}>
            <option value="">Toutes classes</option>
            {classes.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
          </select>
          {salles.length > 1 && (
            <select value={filterSalle} onChange={(e) => setFilterSalle(e.target.value)} style={{ flex: 1, height: 32, border: `1px solid ${B}`, padding: '0 8px', fontSize: 11, fontFamily: 'inherit', background: '#fff' }}>
              <option value="">Toutes salles</option>
              {salles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {/* Course list for selected day */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
          {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : dayCours.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Pas de cours {dayName?.toLowerCase()}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {dayCours.map((c) => {
                const col = matiereColorMap.get(c.matiereId) ?? MATIERE_COLORS[0];
                const isCurrent = c.jour === nowDay && nowHeure >= c.heureDebut && nowHeure < c.heureFin;
                const duree = parseInt(c.heureFin.split(':')[0]) - parseInt(c.heureDebut.split(':')[0]);
                return (
                  <div key={c.id} onClick={() => setDetail(c)}
                    style={{ background: col.bg, borderLeft: `4px solid ${col.border}`, padding: '14px 16px', cursor: 'pointer', boxShadow: isCurrent ? `0 0 0 2px ${col.border}` : 'none', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: col.text }}>{c.matiere}</div>
                        <div style={{ fontSize: 12, color: col.text, opacity: 0.8, marginTop: 2 }}>{c.classe}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col.text }}>{c.heureDebut} — {c.heureFin}</div>
                        <div style={{ fontSize: 10, color: col.text, opacity: 0.6 }}>{duree}h</div>
                      </div>
                    </div>
                    {c.salle && <div style={{ fontSize: 11, color: col.text, opacity: 0.6, marginTop: 6 }}>Salle : {c.salle}</div>}
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: '#fff', background: '#dc2626', padding: '2px 6px', borderRadius: 4 }}>EN COURS</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail modal mobile */}
        {detail && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
            <div style={{ background: '#fff', width: '100%', maxHeight: '70vh', borderRadius: '16px 16px 0 0', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '10px auto' }} />
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${B}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 30, background: matiereColorMap.get(detail.matiereId)?.border ?? '#2563eb', borderRadius: 2 }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.matiere}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{detail.classe}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ label: 'Jour', value: detail.jour }, { label: 'Salle', value: detail.salle || '—' }, { label: 'Début', value: detail.heureDebut }, { label: 'Fin', value: detail.heureFin }].map((item) => (
                  <div key={item.label} style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 20px 20px' }}>
                <button onClick={() => setDetail(null)} style={{ width: '100%', height: 40, border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', borderRadius: 6 }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP VIEW ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon emploi du temps</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{totalHeures}h/semaine · {filtered.length} créneau(x)</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
            <option value="">Toutes les classes</option>
            {classes.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
          </select>
          {salles.length > 1 && (
            <select value={filterSalle} onChange={(e) => setFilterSalle(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
              <option value="">Toutes les salles</option>
              {salles.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun créneau dans votre emploi du temps</div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${B}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: 70, padding: '11px 4px', background: '#f8fafc', borderBottom: `1px solid ${B}`, borderRight: `1px solid ${B}`, fontSize: 10, color: '#94a3b8' }}>Heure</th>
                  {JOURS.map((j) => (
                    <th key={j} style={{ padding: '11px 10px', background: j === nowDay ? '#eff6ff' : '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700, color: j === nowDay ? '#2563eb' : '#475569', borderLeft: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANCHES.map((tranche, ti) => (
                  <tr key={tranche.debut} style={{ height: 44, borderBottom: ti < TRANCHES.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                    <td style={{ padding: '4px 6px', fontSize: 10, color: '#94a3b8', fontWeight: 600, borderRight: `1px solid #eef2f6`, verticalAlign: 'middle', textAlign: 'center', height: 44, background: nowDay && nowHeure >= tranche.debut && nowHeure < tranche.fin ? '#fef2f2' : 'transparent' }}>
                      {tranche.label}
                    </td>
                    {JOURS.map((jour) => {
                      if (isTrancheCouverte(jour, ti)) return null;
                      const items = getCreneauxStart(jour, tranche.debut);
                      const maxSpan = items.length > 0 ? Math.max(...items.map(getRowSpan)) : 1;

                      if (items.length === 0) {
                        return <td key={jour} style={{ borderLeft: '1px solid #eef2f6', padding: 4, height: 44, background: jour === nowDay ? '#fafbff' : 'transparent' }} />;
                      }
                      return (
                        <td key={jour} rowSpan={maxSpan} style={{ borderLeft: '1px solid #eef2f6', padding: 2, verticalAlign: 'top', background: jour === nowDay ? '#fafbff' : 'transparent' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {items.map((c) => {
                              const col = matiereColorMap.get(c.matiereId) ?? MATIERE_COLORS[0];
                              const isCurrent = jour === nowDay && nowHeure >= c.heureDebut && nowHeure < c.heureFin;
                              const span = getRowSpan(c);
                              return (
                                <div key={c.id} onClick={() => setDetail(c)}
                                  style={{ background: col.bg, padding: '6px 8px', borderLeft: `3px solid ${col.border}`, cursor: 'pointer', minHeight: span * 44 - 8, boxShadow: isCurrent ? `0 0 0 2px ${col.border}` : 'none', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: col.text }}>{c.matiere}</div>
                                  <div style={{ fontSize: 10, color: col.text, opacity: 0.8, marginTop: 1 }}>{c.classe}</div>
                                  {c.salle && <div style={{ fontSize: 9, color: col.text, opacity: 0.6, marginTop: 1 }}>{c.salle}</div>}
                                  {span >= 2 && <div style={{ fontSize: 9, color: col.text, opacity: 0.5, marginTop: 2 }}>{c.heureDebut} — {c.heureFin}</div>}
                                  {isCurrent && <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal desktop */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', width: 380, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${B}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 5, height: 36, background: matiereColorMap.get(detail.matiereId)?.border ?? '#2563eb', borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.matiere}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{detail.classe}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ label: 'Jour', value: detail.jour }, { label: 'Salle', value: detail.salle || '—' }, { label: 'Début', value: detail.heureDebut }, { label: 'Fin', value: detail.heureFin }].map((item) => (
                <div key={item.label} style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 24px 20px' }}>
              <button onClick={() => setDetail(null)} style={{ width: '100%', height: 36, border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
