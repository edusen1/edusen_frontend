'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useProfesseurMesClasses, useProfesseurClasseEleves, useSaisirNotes } from '@/hooks/use-query-api';
import { asArray } from '@/lib/api-data';

/**
 * Les huit élèves fictifs qui servaient de repli ont été retirés : saisir des
 * notes sur des élèves inventés n'a aucun sens, et rien ne distinguait à l'écran
 * une classe vide d'une classe réelle.
 */

type TrimKey = 'T1' | 'T2' | 'T3';

export default function SaisirNotesPage() {
  const { data: classesData } = useProfesseurMesClasses();
  const rawClasses = asArray(classesData, 'classes', 'classesMatieres');

  const [selectedClasseIdChoisi, setSelectedClasseId] = useState<string>('');
  // La première classe sert de valeur initiale, mais seulement une fois les
  // données arrivées : un identifiant inventé (« c1 ») ne correspond à rien.
  const selectedClasseId = selectedClasseIdChoisi || String(rawClasses[0]?.id ?? '');
  const [trimestre, setTrimestre] = useState<TrimKey>('T2');
  const [typeEval, setTypeEval] = useState('Devoir n°3');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});

  const selectedClasse = rawClasses.find((c) => String(c.id) === selectedClasseId);
  const snClasseObj = selectedClasse?.classe as Record<string, unknown> | undefined;
  const snMatiereObj = selectedClasse?.matiere as Record<string, unknown> | undefined;
  // Libellés de repli neutres : « 3ᵉ B » et « Mathématiques » codés en dur
  // laissaient croire à une classe réelle quand aucune n'était chargée.
  const classeNom = String(selectedClasse?.nom ?? snClasseObj?.nom ?? '—');
  const matiereNom = String(snMatiereObj?.libelle ?? snMatiereObj?.nom ?? selectedClasse?.matiere ?? '—');
  const matiereId = String(selectedClasse?.matiereId ?? snMatiereObj?.id ?? '');

  const { data: elevesData } = useProfesseurClasseEleves(selectedClasseId);
  // L'endpoint renvoie des inscriptions : l'élève est imbriqué sous `eleve`.
  const eleves = asArray(elevesData, 'eleves').map((row) => (row.eleve ?? row) as Record<string, unknown>);

  const saisirNotes = useSaisirNotes();

  const setNote = (id: string, val: string) => {
    const num = parseFloat(val);
    if (val === '' || (!isNaN(num) && num >= 0 && num <= 20)) {
      setNotes((prev) => ({ ...prev, [id]: val }));
    }
  };

  const notesVals = Object.values(notes).map(Number).filter((n) => !isNaN(n) && !isNaN(parseFloat(String(n))));
  const moyenne = notesVals.length > 0
    ? (notesVals.reduce((a, b) => a + b, 0) / notesVals.length).toFixed(1).replace('.', ',')
    : '—';

  const handleSave = async () => {
    const notesList = (eleves as Record<string, unknown>[]).map((e) => {
      const eid = String(e.id ?? e.eleveId);
      return { eleveId: eid, valeur: parseFloat(notes[eid] ?? '0') || 0, appreciation: appreciations[eid] ?? '' };
    });
    try {
      await saisirNotes.mutateAsync({ classeId: selectedClasseId, matiereId, data: notesList });
      toast.success('Notes enregistrées');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const getNoteColor = (val: string) => {
    if (!val) return '#0f172a';
    const n = parseFloat(val);
    if (n >= 14) return '#16a34a';
    if (n >= 10) return '#0f172a';
    return '#dc2626';
  };

  const getNoteStyle = (val: string) => ({
    width: 70,
    height: 38,
    border: val ? '1px solid #2563eb' : '1px solid #e2e8f0',
    background: val ? '#eff6ff' : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: val ? getNoteColor(val) : '#94a3b8',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Saisir les notes</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{classeNom} · {matiereNom} · Trimestre {trimestre[1]} · {typeEval} (coef. 1)</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setNotes({}); setAppreciations({}); }}
            style={{ height: 40, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saisirNotes.isPending}
            style={{ height: 40, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saisirNotes.isPending ? 0.7 : 1 }}
          >
            {saisirNotes.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Classe selector */}
        {rawClasses.length > 0 && (
          <select
            value={selectedClasseId}
            onChange={(e) => setSelectedClasseId(e.target.value)}
            style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {(rawClasses as Record<string, unknown>[]).map((c) => {
              const cid = String(c.id ?? c.classeId);
              const cclasse = c.classe as Record<string, unknown> | undefined;
              const cnom = (c.nom ?? cclasse?.nom ?? cid) as string;
              return <option key={cid} value={cid}>{cnom}</option>;
            })}
          </select>
        )}

        {/* Évaluation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid #d9e0e8', padding: '9px 14px', background: '#fff', fontSize: 13, color: '#0f172a' }}>
          <span style={{ color: '#94a3b8' }}>Évaluation</span>
          <strong>{typeEval}</strong>
        </div>

        {/* Trimestre selector */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0' }}>
          {(['T1', 'T2', 'T3'] as TrimKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrimestre(t)}
              style={{ padding: '7px 13px', fontSize: 13, fontWeight: trimestre === t ? 600 : 400, background: trimestre === t ? '#2563eb' : 'transparent', color: trimestre === t ? '#fff' : '#475569', border: 'none', borderLeft: t !== 'T1' ? '1px solid #e6ebf1' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Moyenne */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9, background: '#0f172a', padding: '9px 16px', color: '#fff', fontSize: 13 }}>
          <span style={{ color: '#94a3b8' }}>Moyenne classe</span>
          <strong style={{ fontSize: 15 }}>{moyenne}</strong>
        </div>
      </div>

      {/* Notes table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          {/* Table header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 560 }}>
            <span style={{ width: 40, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>N°</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Élève</span>
            <span style={{ width: 120, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Note /20</span>
            <span style={{ width: 280, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Appréciation</span>
          </div>

          {(eleves as Record<string, unknown>[]).map((eleve, idx) => {
            const eid = String(eleve.id ?? eleve.eleveId ?? idx);
            const ep = (eleve.prenom ?? eleve.firstName ?? '') as string;
            const en = (eleve.nom ?? eleve.lastName ?? '') as string;
            const num = (eleve.numero ?? eleve.matricule ?? String(idx + 1).padStart(2, '0')) as string;
            const noteVal = notes[eid] ?? '';
            const apprVal = appreciations[eid] ?? '';

            return (
              <div
                key={eid}
                style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', borderBottom: idx < eleves.length - 1 ? '1px solid #eef2f6' : 'none', minWidth: 560 }}
              >
                <span style={{ width: 40, fontSize: 13, color: '#94a3b8' }}>{num}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {((ep[0] ?? '') + (en[0] ?? '')).toUpperCase() || num}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ep} {en}</span>
                </div>
                <div style={{ width: 120, display: 'flex', justifyContent: 'center' }}>
                  <div style={getNoteStyle(noteVal)}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={noteVal}
                      onChange={(e) => setNote(eid, e.target.value)}
                      placeholder="—"
                      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: 15, fontWeight: 700, color: noteVal ? getNoteColor(noteVal) : '#94a3b8', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ width: 280 }}>
                  <input
                    type="text"
                    value={apprVal}
                    onChange={(e) => setAppreciations((prev) => ({ ...prev, [eid]: e.target.value }))}
                    placeholder="Appréciation…"
                    style={{ height: 38, width: '100%', border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#475569', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
