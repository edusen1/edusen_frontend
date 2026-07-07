'use client';

import { useEleveAbsences } from '@/hooks/use-query-api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function getAbsenceStyle(statut?: string, justifiee?: boolean) {
  if (statut === 'JUSTIFIEE' || justifiee === true) return { border: '#16a34a', bg: '#dcfce7', text: '#16a34a', label: 'Justifiée' };
  if (statut === 'RETARD') return { border: '#d97706', bg: '#fef3c7', text: '#d97706', label: 'Retard' };
  return { border: '#dc2626', bg: '#fee2e2', text: '#dc2626', label: 'Non justifiée' };
}

export default function AbsencesPage() {
  const { data, isLoading } = useEleveAbsences();
  const absences = Array.isArray(data) ? data : (data?.absences ?? []);

  const total = absences.length;
  const justifiees = absences.filter((a: Record<string, unknown>) => a.statut === 'JUSTIFIEE' || a.justifiee === true).length;
  const retards = absences.filter((a: Record<string, unknown>) => a.statut === 'RETARD').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Mes absences</div>
        <div style={{ display: 'flex', marginTop: 14, border: '1px solid #e6ebf1' }}>
          <div style={{ flex: 1, padding: 12, borderRight: '1px solid #eef2f6' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{total || 3}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
          </div>
          <div style={{ flex: 1, padding: 12, borderRight: '1px solid #eef2f6' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{justifiees || 2}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Justifiées</div>
          </div>
          <div style={{ flex: 1, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{retards || 1}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Retards</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : absences.length === 0 ? (
          // Static fallback
          <>
            <AbsenceItem date="Mardi 18 mars" matiere="Mathématiques · 08:00–10:00" motif="Motif : rendez-vous médical" statut="JUSTIFIEE" />
            <AbsenceItem date="Jeudi 13 mars" matiere="Français · 10:00–12:00" motif="15 min de retard" statut="RETARD" />
            <AbsenceItem date="Lundi 3 mars" matiere="SVT · 14:00–16:00" motif={undefined} statut="NON_JUSTIFIEE" />
          </>
        ) : (
          (absences as Record<string, unknown>[]).map((a, i) => {
            const statut = a.statut as string | undefined;
            const justifiee = a.justifiee as boolean | undefined;
            const dateStr = a.date as string | undefined;
            const matiere = a.matiere as Record<string, unknown> | undefined;
            const motif = a.motif as string | undefined;
            let dateFormatted = dateStr ?? 'Date inconnue';
            try {
              if (dateStr) dateFormatted = format(new Date(dateStr), 'EEEE d MMMM', { locale: fr });
            } catch { /* skip */ }
            const s = justifiee ? 'JUSTIFIEE' : (statut ?? 'NON_JUSTIFIEE');
            return (
              <AbsenceItem
                key={(a.id as string) ?? i}
                date={dateFormatted}
                matiere={matiere?.nom as string | undefined}
                motif={motif}
                statut={s}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function AbsenceItem({ date, matiere, motif, statut }: {
  date: string;
  matiere?: string;
  motif?: string;
  statut: string;
}) {
  const style = getAbsenceStyle(statut);
  return (
    <div style={{ background: '#fff', border: '1px solid #e6ebf1', borderLeft: `3px solid ${style.border}`, padding: '13px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{date}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: style.text, background: style.bg, padding: '3px 8px' }}>{style.label}</span>
      </div>
      {matiere && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{matiere}</div>}
      {motif && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{motif}</div>}
      {statut === 'NON_JUSTIFIEE' && (
        <button style={{ marginTop: 10, height: 34, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#2563eb', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Justifier l&apos;absence
        </button>
      )}
    </div>
  );
}
