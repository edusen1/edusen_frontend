'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useProfesseurMesClasses, useProfesseurClasseEleves, useFaireAppel } from '@/hooks/use-query-api';

type Statut = 'present' | 'absent' | 'retard';

const STATIC_ELEVES = [
  { id: 'e1', prenom: 'Awa', nom: 'Ndiaye', numero: '04' },
  { id: 'e2', prenom: 'Cheikh', nom: 'Sarr', numero: '07' },
  { id: 'e3', prenom: 'Fatou', nom: 'Bâ', numero: '11' },
  { id: 'e4', prenom: 'Ibrahima', nom: 'Fall', numero: '13' },
  { id: 'e5', prenom: 'Mariama', nom: 'Diop', numero: '18' },
  { id: 'e6', prenom: 'Moussa', nom: 'Diallo', numero: '21' },
  { id: 'e7', prenom: 'Fatou', nom: 'Sall', numero: '24' },
  { id: 'e8', prenom: 'Aminata', nom: 'Cissé', numero: '28' },
];

export default function AppelPage() {
  const { data: classesData } = useProfesseurMesClasses();
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes ?? classesData?.classesMatieres ?? []);

  const [selectedClasseId, setSelectedClasseId] = useState<string>(
    rawClasses.length > 0 ? String((rawClasses[0] as Record<string, unknown>)?.id ?? 'c1') : 'c1'
  );

  const selectedClasse = (rawClasses as Record<string, unknown>[]).find((c) => String(c.id) === selectedClasseId);
  const sClasseObj = selectedClasse?.classe as Record<string, unknown> | undefined;
  const sMatiereObj = selectedClasse?.matiere as Record<string, unknown> | undefined;
  const classeNom = selectedClasse ? ((selectedClasse.nom ?? sClasseObj?.nom ?? '3ᵉ B') as string) : '3ᵉ B';
  const matiereNom = selectedClasse ? ((sMatiereObj?.nom ?? selectedClasse.matiere ?? 'Mathématiques') as string) : 'Mathématiques';

  const { data: elevesData } = useProfesseurClasseEleves(selectedClasseId);
  const rawEleves = Array.isArray(elevesData) ? elevesData : (elevesData?.eleves ?? []);
  const eleves = rawEleves.length > 0 ? rawEleves : STATIC_ELEVES;

  const [presences, setPresences] = useState<Record<string, Statut>>({});
  const faireAppel = useFaireAppel();

  const setStatut = (id: string, statut: Statut) => {
    setPresences((prev) => ({ ...prev, [id]: statut }));
  };

  const nbPresents = Object.values(presences).filter((s) => s === 'present').length;
  const nbAbsents = Object.values(presences).filter((s) => s === 'absent').length;
  const nbRetards = Object.values(presences).filter((s) => s === 'retard').length;
  const effectif = eleves.length;

  const handleValider = async () => {
    const presenceList = (eleves as Record<string, unknown>[]).map((e) => {
      const eid = String(e.id ?? e.eleveId);
      return { eleveId: eid, statut: presences[eid] ?? 'present' };
    });
    try {
      await faireAppel.mutateAsync({ classeId: selectedClasseId, data: presenceList });
      toast.success('Appel validé avec succès');
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Faire l'appel</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{classeNom} · {matiereNom} · {dateStr}</div>
        </div>
        <button
          onClick={handleValider}
          disabled={faireAppel.isPending}
          style={{ marginLeft: 'auto', height: 40, padding: '0 20px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: faireAppel.isPending ? 0.7 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          {faireAppel.isPending ? 'Validation…' : 'Valider l\'appel'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Présents', count: nbPresents, bg: '#dcfce7', iconColor: '#16a34a', icon: <path d="M20 6 9 17l-5-5"/> },
          { label: 'Absents', count: nbAbsents, bg: '#fee2e2', iconColor: '#dc2626', icon: <><path d="M18 6 6 18"/><path d="M6 6l12 12"/></> },
          { label: 'Retards', count: nbRetards, bg: '#fef3c7', iconColor: '#d97706', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> },
          { label: 'Effectif', count: effectif, bg: '#eff6ff', iconColor: '#2563eb', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Students table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          {/* Table header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 480 }}>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Élève</span>
            <span style={{ width: 280, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Présence</span>
          </div>

          {(eleves as Record<string, unknown>[]).map((eleve, idx) => {
            const eid = String(eleve.id ?? eleve.eleveId ?? idx);
            const ep = (eleve.prenom ?? eleve.firstName ?? '') as string;
            const en = (eleve.nom ?? eleve.lastName ?? '') as string;
            const num = (eleve.numero ?? eleve.matricule ?? String(idx + 1).padStart(2, '0')) as string;
            const statut = presences[eid];

            return (
              <div
                key={eid}
                style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', borderBottom: idx < eleves.length - 1 ? '1px solid #eef2f6' : 'none', minWidth: 480 }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {((ep[0] ?? '') + (en[0] ?? '')).toUpperCase() || num}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ep} {en}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>N° {num}</div>
                  </div>
                </div>
                <div style={{ width: 280, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {(['present', 'absent', 'retard'] as Statut[]).map((s) => {
                    const isActive = statut === s;
                    const activeBg = s === 'present' ? '#16a34a' : s === 'absent' ? '#dc2626' : '#d97706';
                    const label = s === 'present' ? 'Présent' : s === 'absent' ? 'Absent' : 'Retard';
                    return (
                      <button
                        key={s}
                        onClick={() => setStatut(eid, s)}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '8px 0',
                          fontSize: 12,
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? '#fff' : '#94a3b8',
                          background: isActive ? activeBg : 'transparent',
                          border: isActive ? 'none' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
