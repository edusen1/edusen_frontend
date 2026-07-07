'use client';

import { useState } from 'react';
import { useProfesseurEmploiDuTemps } from '@/hooks/use-query-api';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const CLASSE_COLORS = [
  { border: '#2563eb', bg: '#eff6ff', text: '#1d4ed8' },
  { border: '#7c3aed', bg: '#f5f3ff', text: '#6d28d9' },
  { border: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  { border: '#d97706', bg: '#fef3c7', text: '#b45309' },
  { border: '#dc2626', bg: '#fee2e2', text: '#b91c1c' },
  { border: '#0891b2', bg: '#ecfeff', text: '#0e7490' },
];

const STATIC_COURS = [
  { id: 1, matiere: 'Mathématiques', classe: '3ème B', salle: 'S12', jourIndex: 0, heureDebut: '08:00', heureFin: '10:00' },
  { id: 2, matiere: 'Mathématiques', classe: '4ème A', salle: 'S08', jourIndex: 0, heureDebut: '10:00', heureFin: '11:00' },
  { id: 3, matiere: 'Physique', classe: '2nde C', salle: 'Labo1', jourIndex: 1, heureDebut: '08:00', heureFin: '10:00' },
  { id: 4, matiere: 'Mathématiques', classe: '5ème C', salle: 'S15', jourIndex: 1, heureDebut: '11:00', heureFin: '12:00' },
  { id: 5, matiere: 'Mathématiques', classe: '3ème B', salle: 'S12', jourIndex: 2, heureDebut: '08:00', heureFin: '09:00' },
  { id: 6, matiere: 'Physique', classe: '2nde C', salle: 'S10', jourIndex: 3, heureDebut: '10:00', heureFin: '11:00' },
  { id: 7, matiere: 'Mathématiques', classe: '4ème A', salle: 'S08', jourIndex: 4, heureDebut: '08:00', heureFin: '10:00' },
  { id: 8, matiere: 'Mathématiques', classe: '5ème C', salle: 'S15', jourIndex: 5, heureDebut: '08:00', heureFin: '09:00' },
];

interface Cours {
  id: number | string;
  matiere: string;
  classe: string;
  salle: string;
  jourIndex: number;
  heureDebut: string;
  heureFin: string;
}

interface DetailModal {
  cours: Cours;
  color: { border: string; bg: string; text: string };
}

function heureToIndex(h: string) {
  return HEURES.indexOf(h);
}

function calcHeures(cours: Cours[]) {
  return cours.reduce((sum, c) => {
    const debut = heureToIndex(c.heureDebut);
    const fin = heureToIndex(c.heureFin);
    return sum + (fin > debut ? fin - debut : 0);
  }, 0);
}

export default function EmploiDuTempsProf() {
  const { data } = useProfesseurEmploiDuTemps();
  const [detail, setDetail] = useState<DetailModal | null>(null);

  const raw = Array.isArray(data) ? data : (data?.seances ?? data?.cours ?? data?.data ?? []);
  const cours: Cours[] = (raw as Record<string, unknown>[]).length > 0
    ? (raw as Record<string, unknown>[]).map((c, i) => ({
        id: String(c.id ?? c._id ?? i),
        matiere: String(c.matiere ?? c.matiereName ?? c.subject ?? ''),
        classe: String(c.classe ?? c.className ?? ''),
        salle: String(c.salle ?? c.room ?? ''),
        jourIndex: Number(c.jourIndex ?? c.jour ?? c.dayIndex ?? 0),
        heureDebut: String(c.heureDebut ?? c.startTime ?? '08:00'),
        heureFin: String(c.heureFin ?? c.endTime ?? '09:00'),
      }))
    : STATIC_COURS;

  // Assign color per unique classe
  const classesUniques = [...new Set(cours.map((c) => c.classe))];
  const classeColorMap: Record<string, typeof CLASSE_COLORS[0]> = {};
  classesUniques.forEach((cl, i) => {
    classeColorMap[cl] = CLASSE_COLORS[i % CLASSE_COLORS.length];
  });

  const totalHeures = calcHeures(cours);

  const exportCSV = () => {
    const rows = [['Jour', 'Matière', 'Classe', 'Salle', 'Heure début', 'Heure fin']];
    cours.forEach((c) => {
      rows.push([JOURS[c.jourIndex] ?? String(c.jourIndex), c.matiere, c.classe, c.salle, c.heureDebut, c.heureFin]);
    });
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'emploi-du-temps.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Mon emploi du temps</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{totalHeures}h / semaine · {cours.length} séances</div>
        </div>
        <button onClick={exportCSV} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Exporter CSV
        </button>
      </div>

      {/* Legend */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {classesUniques.map((cl) => {
          const col = classeColorMap[cl];
          return (
            <span key={cl} style={{ fontSize: 11, fontWeight: 600, color: col.text, background: col.bg, border: `1px solid ${col.border}`, padding: '3px 10px' }}>
              {cl}
            </span>
          );
        })}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700, background: '#fff', border: '1px solid #e6ebf1' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', borderBottom: '1px solid #e6ebf1' }}>
              <div style={{ borderRight: '1px solid #e6ebf1' }} />
              {JOURS.map((j) => (
                <div key={j} style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#475569', borderRight: '1px solid #f1f5f9' }}>
                  {j.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Time rows */}
            {HEURES.map((heure, hi) => (
              <div key={heure} style={{ display: 'grid', gridTemplateColumns: '56px repeat(6, 1fr)', borderBottom: hi < HEURES.length - 1 ? '1px solid #f1f5f9' : 'none', minHeight: 52 }}>
                <div style={{ borderRight: '1px solid #e6ebf1', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{heure}</span>
                </div>
                {JOURS.map((_, ji) => {
                  const c = cours.find((c) => c.jourIndex === ji && c.heureDebut === heure);
                  const isOccupied = cours.some((c) => {
                    if (c.jourIndex !== ji) return false;
                    const cStart = heureToIndex(c.heureDebut);
                    const cEnd = heureToIndex(c.heureFin);
                    return hi > cStart && hi < cEnd;
                  });
                  if (isOccupied) return <div key={ji} style={{ borderRight: '1px solid #f1f5f9' }} />;
                  const col = c ? classeColorMap[c.classe] : null;
                  return (
                    <div key={ji} style={{ borderRight: ji < 5 ? '1px solid #f1f5f9' : 'none', padding: 3 }}>
                      {c && col && (
                        <button
                          onClick={() => setDetail({ cours: c, color: col })}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            border: `1px solid ${col.border}`,
                            background: col.bg,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            minHeight: `${(heureToIndex(c.heureFin) - heureToIndex(c.heureDebut)) * 52 - 8}px`,
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: col.text }}>{c.matiere}</div>
                          <div style={{ fontSize: 10, color: col.text, opacity: 0.8 }}>{c.classe}</div>
                          <div style={{ fontSize: 10, color: col.text, opacity: 0.6 }}>{c.salle}</div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', width: 360, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 6, height: 32, background: detail.color.border }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.cours.matiere}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{detail.cours.classe}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              {[
                { label: 'Jour', value: JOURS[detail.cours.jourIndex] ?? String(detail.cours.jourIndex) },
                { label: 'Salle', value: detail.cours.salle },
                { label: 'Heure début', value: detail.cours.heureDebut },
                { label: 'Heure fin', value: detail.cours.heureFin },
              ].map((item) => (
                <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setDetail(null)} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
