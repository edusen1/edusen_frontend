'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const B = '#e6ebf1';
type TabKey = 'eleves' | 'enseignants' | 'personnel';

const AbsencesEleves = dynamic(() => import('../absences-eleves/page'), { ssr: false });
const AbsencesEnseignants = dynamic(() => import('../absences-personnel/page'), { ssr: false });
const AbsencesPersonnel = dynamic(() => import('../absences-personnel-list/page'), { ssr: false });

export default function AbsencesPage() {
  const [tab, setTab] = useState<TabKey>('eleves');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'eleves', label: 'Élèves' },
    { key: 'enseignants', label: 'Enseignants' },
    { key: 'personnel', label: 'Personnel' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Onglets principaux */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, display: 'flex', padding: '0 24px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: 44, padding: '0 22px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#2563eb' : '#64748b', borderBottom: tab === t.key ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu — chaque onglet a ses propres sous-onglets (Tableau de bord, Absences, Demandes) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'eleves' && <AbsencesEleves />}
        {tab === 'enseignants' && <AbsencesEnseignants />}
        {tab === 'personnel' && <AbsencesPersonnel />}
      </div>
    </div>
  );
}
