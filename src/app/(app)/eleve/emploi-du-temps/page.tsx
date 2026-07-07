'use client';

import { Fragment, useState } from 'react';
import { useEleveEmploiDuTemps } from '@/hooks/use-query-api';

const JOURS = [
  { label: 'Lun', full: 'Lundi' },
  { label: 'Mar', full: 'Mardi' },
  { label: 'Mer', full: 'Mercredi' },
  { label: 'Jeu', full: 'Jeudi' },
  { label: 'Ven', full: 'Vendredi' },
  { label: 'Sam', full: 'Samedi' },
];

const STATIC_COURSES = [
  { time: '08:00', duration: '2h', subject: 'Mathématiques', teacher: 'M. Diallo', room: 'B12', bg: '#eff6ff', borderColor: '#2563eb', textColor: '#1e3a8a', subColor: '#3b82f6' },
  { time: '10:00', duration: '2h', subject: 'Français', teacher: 'Mme Sow', room: 'A04', bg: '#f5f3ff', borderColor: '#7c3aed', textColor: '#5b21b6', subColor: '#7c3aed' },
  { time: '12:00', duration: '1h', subject: 'Pause déjeuner', teacher: '', room: '', bg: '#f8fafc', borderColor: '#cbd5e1', textColor: '#94a3b8', subColor: '' },
  { time: '14:00', duration: '1h', subject: 'SVT', teacher: 'M. Bâ', room: 'Labo 2', bg: '#ecfdf5', borderColor: '#059669', textColor: '#065f46', subColor: '#059669' },
  { time: '15:00', duration: '1h', subject: 'Histoire-Géo', teacher: 'Mme Faye', room: 'C07', bg: '#fffbeb', borderColor: '#d97706', textColor: '#92400e', subColor: '#d97706' },
  { time: '16:00', duration: '1h', subject: 'Anglais', teacher: 'Mr. Camara', room: 'B03', bg: '#fef2f2', borderColor: '#e11d48', textColor: '#9f1239', subColor: '#e11d48' },
  { time: '17:00', duration: '1h', subject: 'Libre', teacher: '', room: '', bg: 'transparent', borderColor: '#e2e8f0', textColor: '#cbd5e1', subColor: '' },
];

export default function EmploiDuTempsPage() {
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const defaultIdx = today >= 1 && today <= 6 ? today - 1 : 0;
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx);

  const { data } = useEleveEmploiDuTemps();
  const emplois = Array.isArray(data) ? data : (data?.emplois ?? data?.creneaux ?? []);

  const joursWithCourses = JOURS.map((j) => ({
    ...j,
    courses: emplois.filter((e: Record<string, unknown>) => {
      const jour = (e.jour as string ?? '').toLowerCase();
      return jour === j.full.toLowerCase();
    }),
  }));

  const currentJour = joursWithCourses[selectedIdx];
  const courses = currentJour.courses.length > 0
    ? (currentJour.courses as Record<string, unknown>[]).map((e) => {
        const matiere = (e.matiere as Record<string, unknown>) ?? {};
        const nom = (matiere.nom ?? e.nom ?? 'Cours') as string;
        const prof = e.professeur as Record<string, unknown> | undefined;
        const profNom = prof ? `${prof.prenom ?? prof.firstName ?? ''} ${prof.nom ?? prof.lastName ?? ''}`.trim() : '';
        const salle = (e.salle ?? '') as string;
        const debut = (e.heureDebut ?? '') as string;
        return { time: debut, subject: nom, teacher: profNom, room: salle, bg: '#eff6ff', borderColor: '#2563eb', textColor: '#1e3a8a', subColor: '#3b82f6', isDashed: false };
      })
    : STATIC_COURSES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Emploi du temps</div>
        <div style={{ display: 'flex', marginTop: 12, border: '1px solid #d9e0e8' }}>
          {JOURS.map((j, idx) => (
            <button
              key={j.label}
              onClick={() => setSelectedIdx(idx)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 0',
                fontSize: 12,
                fontWeight: selectedIdx === idx ? 700 : 600,
                color: selectedIdx === idx ? '#fff' : '#64748b',
                background: selectedIdx === idx ? '#2563eb' : 'transparent',
                border: 'none',
                borderRight: idx < JOURS.length - 1 ? '1px solid #e6ebf1' : 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr' }}>
          {courses.map((course, idx) => (
            <Fragment key={idx}>
              <div style={{ borderBottom: '1px solid #eef2f6', borderRight: '1px solid #e6ebf1', padding: '14px 0', textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#fafbfc' }}>
                {course.time}
              </div>
              <div style={{ borderBottom: '1px solid #eef2f6', padding: '8px 12px' }}>
                {course.subject === 'Libre' ? (
                  <div style={{ border: '1px dashed #e2e8f0', padding: '9px 11px' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>Libre</div>
                  </div>
                ) : (
                  <div style={{ background: course.bg, borderLeft: `3px solid ${course.borderColor}`, padding: '9px 11px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: course.textColor }}>{course.subject}</div>
                    {(course.teacher || course.room) && (
                      <div style={{ fontSize: 11, color: course.subColor || '#94a3b8' }}>
                        {course.teacher}{course.teacher && course.room ? ' · ' : ''}{course.room}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
