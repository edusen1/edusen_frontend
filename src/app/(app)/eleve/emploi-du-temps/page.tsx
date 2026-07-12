'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TRANCHES = [
  { label: '08h-09h', debut: '08:00', fin: '09:00' }, { label: '09h-10h', debut: '09:00', fin: '10:00' },
  { label: '10h-11h', debut: '10:00', fin: '11:00' }, { label: '11h-12h', debut: '11:00', fin: '12:00' },
  { label: '12h-13h', debut: '12:00', fin: '13:00' }, { label: '13h-14h', debut: '13:00', fin: '14:00' },
  { label: '14h-15h', debut: '14:00', fin: '15:00' }, { label: '15h-16h', debut: '15:00', fin: '16:00' },
  { label: '16h-17h', debut: '16:00', fin: '17:00' }, { label: '17h-18h', debut: '17:00', fin: '18:00' },
  { label: '18h-19h', debut: '18:00', fin: '19:00' },
];
const COLORS = [
  { border: '#2563eb', bg: '#eff6ff', text: '#1d4ed8' }, { border: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9' },
  { border: '#16a34a', bg: '#dcfce7', text: '#15803d' }, { border: '#d97706', bg: '#fef3c7', text: '#b45309' },
  { border: '#dc2626', bg: '#fee2e2', text: '#b91c1c' }, { border: '#0891b2', bg: '#ecfeff', text: '#0e7490' },
];

interface Creneau { id: string; jour: string; heureDebut: string; heureFin: string; matiere: string; matiereId: string; enseignant: string; salle: string; }

function useIsMobile() { const [m, setM] = useState(false); useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c); }, []); return m; }

export default function EleveEdtPage() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const now = new Date();
  const todayIdx = now.getDay() >= 1 && now.getDay() <= 6 ? now.getDay() - 1 : 0;
  const [mobileDay, setMobileDay] = useState(todayIdx);
  const nowDay = JOURS[todayIdx] ?? '';
  const nowH = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/eleve/emploi-du-temps');
      const data = Array.isArray(res.data) ? res.data : ((res.data as R)?.cours ?? (res.data as R)?.data ?? []);
      setCreneaux((data as R[]).map((c) => ({
        id: String(c.id ?? ''), jour: String(c.jourSemaine ?? c.jour ?? 'Lundi'),
        heureDebut: String(c.heureDebut ?? '08:00').padStart(5, '0'), heureFin: String(c.heureFin ?? '09:00').padStart(5, '0'),
        matiere: String(c.matiereLibelle ?? (c.matiere as R)?.libelle ?? ''), matiereId: String(c.matiereId ?? ''),
        enseignant: String(c.enseignantNom ?? ''), salle: String(c.salleNom ?? ''),
      })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const matIds = [...new Set(creneaux.map((c) => c.matiereId))];
  const colorMap = new Map(matIds.map((m, i) => [m, COLORS[i % COLORS.length]]));

  function trancheIdx(h: string) { return TRANCHES.findIndex((t) => parseInt(t.debut) === parseInt(h)); }
  function rowSpan(c: Creneau) { const s = trancheIdx(c.heureDebut); const e = trancheIdx(c.heureFin); return e > s ? e - s : 1; }
  function starts(jour: string, d: string) { return creneaux.filter((c) => c.jour === jour && parseInt(c.heureDebut) === parseInt(d)); }
  function covered(jour: string, ti: number) { return creneaux.some((c) => { if (c.jour !== jour) return false; const s = trancheIdx(c.heureDebut); return ti > s && ti < s + rowSpan(c); }); }

  const totalH = creneaux.reduce((s, c) => s + Math.max(0, parseInt(c.heureFin) - parseInt(c.heureDebut)), 0);

  // Mobile
  if (isMobile) {
    const dayName = JOURS[mobileDay];
    const dayCours = creneaux.filter((c) => c.jour === dayName).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon emploi du temps</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{totalH}h/semaine</div>
        </div>
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, display: 'flex', padding: '0 8px', overflowX: 'auto' }}>
          {JOURS.map((j, ji) => (
            <button key={j} onClick={() => setMobileDay(ji)} style={{ flex: '0 0 auto', height: 42, padding: '0 14px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: mobileDay === ji ? 700 : 400, color: mobileDay === ji ? '#2563eb' : '#64748b', borderBottom: mobileDay === ji ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{j.slice(0, 3)}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px' }}>
          {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : dayCours.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Pas de cours</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayCours.map((c) => { const col = colorMap.get(c.matiereId) ?? COLORS[0]; const cur = c.jour === nowDay && nowH >= c.heureDebut && nowH < c.heureFin; return (
                <div key={c.id} style={{ background: col.bg, borderLeft: `4px solid ${col.border}`, padding: '12px 14px', boxShadow: cur ? `0 0 0 2px ${col.border}` : 'none', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: col.text }}>{c.matiere}</div><div style={{ fontSize: 11, color: col.text, opacity: 0.7 }}>{c.enseignant}{c.salle ? ` · ${c.salle}` : ''}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700, color: col.text }}>{c.heureDebut}—{c.heureFin}</div></div>
                  </div>
                  {cur && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, fontWeight: 700, color: '#fff', background: '#dc2626', padding: '2px 6px', borderRadius: 4 }}>EN COURS</div>}
                </div>
              ); })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mon emploi du temps</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{totalH}h/semaine · {creneaux.length} créneau(x)</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : creneaux.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun créneau</div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${B}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead><tr>
                <th style={{ width: 70, padding: '11px 4px', background: '#f8fafc', borderBottom: `1px solid ${B}`, borderRight: `1px solid ${B}`, fontSize: 10, color: '#94a3b8' }}>Heure</th>
                {JOURS.map((j) => <th key={j} style={{ padding: '11px 10px', background: j === nowDay ? '#eff6ff' : '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700, color: j === nowDay ? '#2563eb' : '#475569', borderLeft: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>{j}</th>)}
              </tr></thead>
              <tbody>
                {TRANCHES.map((tr, ti) => (
                  <tr key={tr.debut} style={{ height: 44, borderBottom: ti < TRANCHES.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                    <td style={{ padding: '4px 6px', fontSize: 10, color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #eef2f6', verticalAlign: 'middle', textAlign: 'center', height: 44 }}>{tr.label}</td>
                    {JOURS.map((jour) => {
                      if (covered(jour, ti)) return null;
                      const items = starts(jour, tr.debut);
                      const span = items.length > 0 ? Math.max(...items.map(rowSpan)) : 1;
                      if (items.length === 0) return <td key={jour} style={{ borderLeft: '1px solid #eef2f6', height: 44, background: jour === nowDay ? '#fafbff' : 'transparent' }} />;
                      return (
                        <td key={jour} rowSpan={span} style={{ borderLeft: '1px solid #eef2f6', padding: 2, verticalAlign: 'top', background: jour === nowDay ? '#fafbff' : 'transparent' }}>
                          {items.map((c) => { const col = colorMap.get(c.matiereId) ?? COLORS[0]; const cur = jour === nowDay && nowH >= c.heureDebut && nowH < c.heureFin; return (
                            <div key={c.id} style={{ background: col.bg, padding: '6px 8px', borderLeft: `3px solid ${col.border}`, minHeight: rowSpan(c) * 44 - 8, boxShadow: cur ? `0 0 0 2px ${col.border}` : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: col.text }}>{c.matiere}</div>
                              <div style={{ fontSize: 10, color: col.text, opacity: 0.7 }}>{c.enseignant}</div>
                              {c.salle && <div style={{ fontSize: 9, color: col.text, opacity: 0.5 }}>{c.salle}</div>}
                              <div style={{ fontSize: 9, color: col.text, opacity: 0.5 }}>{c.heureDebut}—{c.heureFin}</div>
                            </div>
                          ); })}
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
    </div>
  );
}
