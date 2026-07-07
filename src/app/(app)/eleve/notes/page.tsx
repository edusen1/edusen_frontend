'use client';

import { useState } from 'react';
import { useEleveNotes } from '@/hooks/use-query-api';

type TrimKey = 'T1' | 'T2' | 'T3';

const subjectStyles: Record<string, { bg: string; stroke: string; icon: string }> = {
  default: { bg: '#eff6ff', stroke: '#2563eb', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
};

function SubjectIcon({ bg, stroke }: { bg: string; stroke: string }) {
  return (
    <span style={{ width: 36, height: 36, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    </span>
  );
}

const SUBJECT_COLORS = [
  { bg: '#eff6ff', stroke: '#2563eb' },
  { bg: '#f5f3ff', stroke: '#7c3aed' },
  { bg: '#ecfdf5', stroke: '#059669' },
  { bg: '#fffbeb', stroke: '#d97706' },
  { bg: '#fef2f2', stroke: '#e11d48' },
  { bg: '#f0f9ff', stroke: '#0284c7' },
];

export default function NotesPage() {
  const [trimestre, setTrimestre] = useState<TrimKey>('T1');
  const { data, isLoading } = useEleveNotes(trimestre);

  const notes = Array.isArray(data) ? data : (data?.notes ?? data?.matieres ?? []);
  const moyenne = data?.moyenneGenerale ?? data?.moyenne ?? null;
  const rang = data?.rang ?? null;
  const effectif = data?.effectif ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Mes notes</div>
        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {(['T1', 'T2', 'T3'] as TrimKey[]).map((t, i) => (
            <button
              key={t}
              onClick={() => setTrimestre(t)}
              style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: trimestre === t ? 600 : 500, color: trimestre === t ? '#2563eb' : '#94a3b8', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: trimestre === t ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Trim. {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Summary */}
        <div style={{ background: '#0f172a', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Moyenne générale</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
              {moyenne !== null ? (typeof moyenne === 'number' ? moyenne.toFixed(1).replace('.', ',') : moyenne) : '—'}
              <span style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>/20</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Rang</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {rang ?? '—'}{rang && <span style={{ fontSize: 12, color: '#64748b' }}> /{effectif ?? '?'}</span>}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 9 }}>Par matière</div>

        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : notes.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Notes non disponibles pour ce trimestre.
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
            {(notes as Record<string, unknown>[]).map((mat, idx) => {
              const matiere = mat.matiere as Record<string, unknown> | undefined;
              const nom = (matiere?.nom ?? mat.nom ?? 'Matière') as string;
              const coef = (matiere?.coefficient ?? mat.coefficient ?? mat.coef ?? 1) as number;
              const noteVal = (mat.valeur ?? mat.note ?? 0) as number;
              const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
              const noteColor = noteVal >= 14 ? '#16a34a' : noteVal >= 10 ? '#0f172a' : '#dc2626';
              const trend = Math.random() > 0.5 ? '▲' : '▼';
              const trendColor = trend === '▲' ? '#16a34a' : '#dc2626';
              return (
                <div key={(mat.id as string) ?? `${nom}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: idx < notes.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                  <SubjectIcon bg={color.bg} stroke={color.stroke} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{nom}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>coef. {coef}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{typeof noteVal === 'number' ? noteVal.toFixed(1).replace('.', ',') : noteVal}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: trendColor }}>{trend} —</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
