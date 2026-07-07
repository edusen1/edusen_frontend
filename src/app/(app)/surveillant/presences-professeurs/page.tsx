'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const STATIC_PROFS = [
  { id: 1, nom: 'Sall', prenom: 'Abdoulaye', matiere: 'Mathématiques', cours: '3ème B — 08h00' },
  { id: 2, nom: 'Diop', prenom: 'Mariama', matiere: 'Français', cours: '4ème A — 08h00' },
  { id: 3, nom: 'Ba', prenom: 'Seydou', matiere: 'Sciences Physiques', cours: '2nde A — 10h00' },
  { id: 4, nom: 'Fall', prenom: 'Khadija', matiere: 'SVT', cours: '6ème A — 10h00' },
  { id: 5, nom: 'Ndiaye', prenom: 'Cheikh', matiere: 'Histoire-Géographie', cours: '3ème B — 11h00' },
  { id: 6, nom: 'Cissé', prenom: 'Ousmane', matiere: 'Anglais', cours: '1ère S2 — 14h00' },
  { id: 7, nom: 'Mendy', prenom: 'Ibou', matiere: 'EPS', cours: 'Terrain — 15h00' },
];

type Statut = 'present' | 'absent' | 'retard';

const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function PresencesProfesseursPage() {
  const [statuts, setStatuts] = useState<Record<number, Statut>>({});

  const nbPresents = Object.values(statuts).filter((s) => s === 'present').length;
  const nbAbsents = Object.values(statuts).filter((s) => s === 'absent').length;
  const nbRetards = Object.values(statuts).filter((s) => s === 'retard').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Présences professeurs</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{today}</div>
        </div>
        <button onClick={() => toast.success('Présences enregistrées')} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Enregistrer
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Présents', value: nbPresents, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Absents', value: nbAbsents, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Retards', value: nbRetards, color: '#d97706', bg: '#fef3c7' },
          { label: 'Non saisis', value: STATIC_PROFS.length - Object.keys(statuts).length, color: '#64748b', bg: '#f1f5f9' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 120px', background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Professors list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', display: 'flex', flexDirection: 'column' }}>
          {STATIC_PROFS.map((prof, i) => {
            const statut = statuts[prof.id];
            return (
              <div key={prof.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < STATIC_PROFS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {prof.prenom[0]}{prof.nom[0]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{prof.prenom} {prof.nom}</div>
                  <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof.matiere} · {prof.cours}</div>
                </div>

                {/* Status badge if set */}
                {statut && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: statut === 'present' ? '#16a34a' : statut === 'retard' ? '#d97706' : '#dc2626',
                    background: statut === 'present' ? '#dcfce7' : statut === 'retard' ? '#fef3c7' : '#fee2e2',
                    padding: '3px 8px',
                    flexShrink: 0,
                  }}>
                    {statut === 'present' ? 'Présent' : statut === 'retard' ? 'Retard' : 'Absent'}
                  </span>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {[
                    { key: 'present' as Statut, label: '✓', activeColor: '#16a34a' },
                    { key: 'retard' as Statut, label: '⏱', activeColor: '#d97706' },
                    { key: 'absent' as Statut, label: '✗', activeColor: '#dc2626' },
                  ].map(({ key, label, activeColor }) => (
                    <button
                      key={key}
                      onClick={() => setStatuts((prev) => ({ ...prev, [prof.id]: key }))}
                      style={{
                        width: 34, height: 34, border: 'none', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                        background: statut === key ? activeColor : '#f1f5f9',
                        color: statut === key ? '#fff' : '#64748b',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
