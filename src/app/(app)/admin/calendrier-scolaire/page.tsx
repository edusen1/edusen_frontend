'use client';

import { useState } from 'react';
import { useAdminCalendrierScolaire } from '@/hooks/use-query-api';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const EVENEMENTS = [
  { date: '2025-09-01', titre: 'Rentrée scolaire 2025–2026', type: 'rentree', couleur: '#2563eb', bg: '#eff6ff' },
  { date: '2025-10-27', titre: 'Début vacances Toussaint', type: 'vacances', couleur: '#d97706', bg: '#fef3c7' },
  { date: '2025-11-04', titre: 'Reprise après Toussaint', type: 'rentree', couleur: '#2563eb', bg: '#eff6ff' },
  { date: '2025-12-22', titre: 'Début vacances Noël', type: 'vacances', couleur: '#d97706', bg: '#fef3c7' },
  { date: '2026-01-06', titre: 'Reprise après Noël', type: 'rentree', couleur: '#2563eb', bg: '#eff6ff' },
  { date: '2026-01-20', titre: 'Conseil de classe T1', type: 'conseil', couleur: '#7c3aed', bg: '#f5f3ff' },
  { date: '2026-02-09', titre: 'Début vacances Hiver', type: 'vacances', couleur: '#d97706', bg: '#fef3c7' },
  { date: '2026-02-23', titre: 'Reprise après Hiver', type: 'rentree', couleur: '#2563eb', bg: '#eff6ff' },
  { date: '2026-03-15', titre: 'Conseil de classe T2', type: 'conseil', couleur: '#7c3aed', bg: '#f5f3ff' },
  { date: '2026-04-06', titre: 'Début vacances Printemps', type: 'vacances', couleur: '#d97706', bg: '#fef3c7' },
  { date: '2026-04-21', titre: 'Reprise après Printemps', type: 'rentree', couleur: '#2563eb', bg: '#eff6ff' },
  { date: '2026-06-10', titre: 'Conseil de classe T3', type: 'conseil', couleur: '#7c3aed', bg: '#f5f3ff' },
  { date: '2026-06-26', titre: 'Fin de l\'année scolaire', type: 'fin', couleur: '#dc2626', bg: '#fee2e2' },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CalendrierScolairePage() {
  const { data: calData } = useAdminCalendrierScolaire();
  const rawEvents = Array.isArray(calData) ? calData : (calData?.evenements ?? calData?.data ?? []);
  const events = (rawEvents as Record<string, unknown>[]).length > 0
    ? (rawEvents as Record<string, unknown>[]).map((e) => ({
        date: String(e.date ?? ''),
        titre: String(e.titre ?? e.title ?? ''),
        type: String(e.type ?? 'autre'),
        couleur: String(e.couleur ?? '#2563eb'),
        bg: String(e.bg ?? '#eff6ff'),
      }))
    : EVENEMENTS;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getEventForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.find((e) => e.date === dateStr);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const upcomingEvents = events
    .filter((e) => e.date >= `${year}-${String(month + 1).padStart(2, '0')}-01`)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Calendrier scolaire</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Année 2025–2026</div>
        <button style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter un événement
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', gap: 20 }}>
        {/* Calendar */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{MOIS[month]} {year}</span>
            <button onClick={nextMonth} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Days header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {JOURS_SEMAINE.map((j) => (
              <div key={j} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', padding: '4px 0' }}>{j}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              const event = day ? getEventForDay(day) : null;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              return (
                <div key={i} style={{ minHeight: 56, padding: 4, background: day ? '#fff' : 'transparent', border: day ? '1px solid #eef2f6' : 'none', position: 'relative' }}>
                  {day && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#fff' : '#0f172a', background: isToday ? '#2563eb' : 'transparent', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        {day}
                      </div>
                      {event && (
                        <div style={{ marginTop: 2, fontSize: 9, fontWeight: 600, color: event.couleur, background: event.bg, padding: '1px 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {event.titre}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Prochains événements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingEvents.map((e) => (
                <div key={e.date} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 4, height: 40, background: e.couleur, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{e.titre}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18, marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Légende</div>
            {[
              { label: 'Rentrée / Reprise', color: '#2563eb', bg: '#eff6ff' },
              { label: 'Vacances', color: '#d97706', bg: '#fef3c7' },
              { label: 'Conseil de classe', color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Fin d\'année', color: '#dc2626', bg: '#fee2e2' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, background: l.bg, border: `2px solid ${l.color}` }} />
                <span style={{ fontSize: 12, color: '#475569' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
