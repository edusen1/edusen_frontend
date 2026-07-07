'use client';

import { useState } from 'react';
import { useAdminClasses, useAdminEmploisDuTemps } from '@/hooks/use-query-api';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const COULEURS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5'];
const COULEURS_TEXTE = ['#1d4ed8', '#15803d', '#b45309', '#be185d', '#7c3aed', '#c2410c'];

const STATIC_CLASSES = ['3ᵉ B', '4ᵉ A', '4ᵉ B', '5ᵉ A', '5ᵉ B'];

const STATIC_EDT: Record<string, Record<string, { matiere: string; professeur: string; salle: string }>> = {
  'Lundi': {
    '08:00': { matiere: 'Mathématiques', professeur: 'M. Diallo', salle: 'B12' },
    '10:00': { matiere: 'Français', professeur: 'Mme Sarr', salle: 'A04' },
    '14:00': { matiere: 'Physique', professeur: 'M. Ndiaye', salle: 'Lab1' },
  },
  'Mardi': {
    '08:00': { matiere: 'Histoire-Géo', professeur: 'Mme Fall', salle: 'C03' },
    '11:00': { matiere: 'Anglais', professeur: 'M. Cissé', salle: 'A07' },
  },
  'Mercredi': {
    '08:00': { matiere: 'SVT', professeur: 'Mme Bâ', salle: 'Lab2' },
    '10:00': { matiere: 'Mathématiques', professeur: 'M. Diallo', salle: 'B12' },
  },
  'Jeudi': {
    '09:00': { matiere: 'Français', professeur: 'Mme Sarr', salle: 'A04' },
    '14:00': { matiere: 'EPS', professeur: 'M. Kane', salle: 'Terrain' },
  },
  'Vendredi': {
    '08:00': { matiere: 'Anglais', professeur: 'M. Cissé', salle: 'A07' },
    '10:00': { matiere: 'Physique', professeur: 'M. Ndiaye', salle: 'Lab1' },
  },
};

export default function EmploisDuTempsPage() {
  const { data: classesData } = useAdminClasses();
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes ?? classesData?.data ?? []);
  const classesNoms = rawClasses.length > 0
    ? (rawClasses as Record<string, unknown>[]).map((c) => {
        const co = c.classe as Record<string, unknown> | undefined;
        return (c.nom ?? co?.nom ?? String(c.id ?? '')) as string;
      })
    : STATIC_CLASSES;

  const [selectedClasse, setSelectedClasse] = useState(classesNoms[0] ?? STATIC_CLASSES[0]);
  const { data: edtData } = useAdminEmploisDuTemps({ classe: selectedClasse });
  const edt = (edtData && typeof edtData === 'object' && !Array.isArray(edtData)) ? edtData as Record<string, unknown> : STATIC_EDT;

  const getCours = (jour: string, heure: string) => {
    const jourData = (edt as Record<string, Record<string, unknown>>)[jour];
    if (!jourData) return null;
    return jourData[heure] as { matiere: string; professeur: string; salle: string } | null;
  };

  const getMatiereColor = (matiere: string) => {
    const idx = matiere.charCodeAt(0) % COULEURS.length;
    return { bg: COULEURS[idx], text: COULEURS_TEXTE[idx] };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Emplois du temps</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {classesNoms.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Ajouter un cours
          </button>
        </div>
      </div>

      {/* Timetable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', borderBottom: '1px solid #e6ebf1' }}>
            <div style={{ padding: '11px 10px', background: '#f8fafc' }} />
            {JOURS.map((j) => (
              <div key={j} style={{ padding: '11px 10px', background: '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', borderLeft: '1px solid #e6ebf1' }}>
                {j}
              </div>
            ))}
          </div>

          {/* Time rows */}
          {HEURES.map((heure, hi) => (
            <div key={heure} style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', borderBottom: hi < HEURES.length - 1 ? '1px solid #eef2f6' : 'none', minHeight: 64 }}>
              <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'flex-start', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #eef2f6', paddingTop: 10 }}>
                {heure}
              </div>
              {JOURS.map((jour) => {
                const cours = getCours(jour, heure);
                const colors = cours ? getMatiereColor(cours.matiere) : null;
                return (
                  <div key={jour} style={{ borderLeft: '1px solid #eef2f6', padding: 6, minHeight: 64, display: 'flex', alignItems: 'stretch' }}>
                    {cours && colors && (
                      <div style={{ flex: 1, background: colors.bg, padding: '7px 9px', borderLeft: `3px solid ${colors.text}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{cours.matiere}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{cours.professeur}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Salle {cours.salle}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
