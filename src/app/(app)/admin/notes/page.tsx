'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminNotes, useAdminClasses, useAdminMatieres, useAdminEleves, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-query-api';

const STATIC_NOTES = [
  { id: 'n1', eleve: 'Moussa Diallo', eleveId: 'e1', matiere: 'Mathématiques', type: 'DEVOIR', note: 15.5, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n2', eleve: 'Fatou Sall', eleveId: 'e2', matiere: 'Mathématiques', type: 'DEVOIR', note: 12.0, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n3', eleve: 'Aminata Diop', eleveId: 'e3', matiere: 'Mathématiques', type: 'DEVOIR', note: 17.0, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n4', eleve: 'Ibrahima Ndiaye', eleveId: 'e4', matiere: 'Mathématiques', type: 'DEVOIR', note: 9.5, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n5', eleve: 'Aissatou Ba', eleveId: 'e5', matiere: 'Mathématiques', type: 'DEVOIR', note: 14.0, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n6', eleve: 'Oumar Fall', eleveId: 'e6', matiere: 'Mathématiques', type: 'DEVOIR', note: 11.5, coeff: 2, date: '2026-03-15', trimestre: '2', classe: '3ème B' },
  { id: 'n7', eleve: 'Rokhaya Sow', eleveId: 'e7', matiere: 'Mathématiques', type: 'COMPOSITION', note: 16.5, coeff: 3, date: '2026-03-20', trimestre: '2', classe: '3ème B' },
  { id: 'n8', eleve: 'Mamadou Cissé', eleveId: 'e8', matiere: 'Mathématiques', type: 'COMPOSITION', note: 8.0, coeff: 3, date: '2026-03-20', trimestre: '2', classe: '3ème B' },
];

type Note = {
  id: string;
  eleve?: string;
  eleveId?: string;
  matiere?: string;
  matiereId?: string;
  type?: string;
  note: number;
  coeff?: number;
  date?: string;
  trimestre?: string;
  classe?: string;
};

function getNoteStyle(n: number): React.CSSProperties {
  if (n >= 16) return { color: '#15803d', fontWeight: 800 };
  if (n >= 12) return { color: '#2563eb', fontWeight: 700 };
  if (n >= 10) return { color: '#d97706', fontWeight: 600 };
  return { color: '#dc2626', fontWeight: 700 };
}

function getEleveName(n: Note): string {
  if (typeof n.eleve === 'string') return n.eleve;
  if (n.eleveId && typeof n.eleveId === 'object') {
    const e = n.eleveId as unknown as Record<string, string>;
    return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
  }
  return String(n.eleveId ?? '—');
}

function getMatiereName(n: Note): string {
  if (typeof n.matiere === 'string') return n.matiere;
  if (n.matiereId && typeof n.matiereId === 'object') {
    const m = n.matiereId as unknown as Record<string, string>;
    return m.nom ?? '';
  }
  return String(n.matiereId ?? '—');
}

const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DEVOIR: { label: 'Devoir', bg: '#eff6ff', color: '#2563eb' },
  COMPOSITION: { label: 'Composition', bg: '#f5f3ff', color: '#7c3aed' },
  EXAMEN: { label: 'Examen', bg: '#fef3c7', color: '#d97706' },
  INTERROGATION: { label: 'Interrogation', bg: '#ecfdf5', color: '#059669' },
};

const EMPTY_FORM = { eleveId: '', matiereId: '', type: 'DEVOIR', note: '', coeff: '1', date: '', trimestre: '2' };

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

export default function AdminNotesPage() {
  const [filterClasse, setFilterClasse] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterTrimestre, setFilterTrimestre] = useState('2');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const { data: notesData } = useAdminNotes({ classeId: filterClasse || undefined, matiereId: filterMatiere || undefined, trimestre: filterTrimestre || undefined });
  const { data: classesData } = useAdminClasses();
  const { data: matieresData } = useAdminMatieres();
  const { data: elevesData } = useAdminEleves({ classeId: filterClasse || undefined });

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const rawNotes = Array.isArray(notesData) ? notesData : (notesData?.notes ?? notesData?.data ?? []);
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes ?? classesData?.data ?? []);
  const rawMatieres = Array.isArray(matieresData) ? matieresData : (matieresData?.matieres ?? matieresData?.data ?? []);
  const rawEleves = Array.isArray(elevesData) ? elevesData : (elevesData?.eleves ?? elevesData?.data ?? []);

  const notes: Note[] = rawNotes.length > 0 ? rawNotes as Note[] : STATIC_NOTES as Note[];

  const filtered = notes.filter((n) => {
    const name = getEleveName(n).toLowerCase();
    const type = n.type ?? '';
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchType = !filterType || type === filterType;
    return matchSearch && matchType;
  });

  const moyenne = filtered.length > 0 ? (filtered.reduce((s, n) => s + n.note, 0) / filtered.length).toFixed(2) : '—';
  const nbEleves = new Set(filtered.map((n) => getEleveName(n))).size;
  const meilleureNote = filtered.length > 0 ? Math.max(...filtered.map((n) => n.note)) : 0;
  const noteMin = filtered.length > 0 ? Math.min(...filtered.map((n) => n.note)) : 0;

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (n: Note) => {
    setEditId(n.id);
    setForm({ eleveId: String(n.eleveId ?? ''), matiereId: String(n.matiereId ?? ''), type: n.type ?? 'DEVOIR', note: String(n.note), coeff: String(n.coeff ?? 1), date: n.date?.slice(0, 10) ?? '', trimestre: n.trimestre ?? '2' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const noteVal = parseFloat(form.note);
    if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) { toast.error('Note invalide (0–20)'); return; }
    if (!form.eleveId && !form.matiereId) { toast.error('Élève et matière requis'); return; }
    setSaving(true);
    try {
      const payload = { eleveId: form.eleveId || undefined, matiereId: form.matiereId || undefined, type: form.type, note: noteVal, coefficient: Number(form.coeff) || 1, date: form.date || undefined, trimestre: form.trimestre || undefined };
      if (editId) await updateNote.mutateAsync({ id: editId, data: payload });
      else await createNote.mutateAsync(payload);
      setShowModal(false);
    } catch { /* hook handles toast */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (n: Note) => {
    if (!confirm(`Supprimer la note de ${getEleveName(n)} ?`)) return;
    try { await deleteNote.mutateAsync(n.id); } catch { /* hook handles toast */ }
  };

  const handleExport = () => {
    const rows = [['Élève', 'Matière', 'Type', 'Note', 'Coeff', 'Trimestre', 'Date']];
    filtered.forEach((n) => rows.push([getEleveName(n), getMatiereName(n), n.type ?? '', String(n.note), String(n.coeff ?? ''), n.trimestre ?? '', n.date ?? '']));
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `notes_T${filterTrimestre}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Notes</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} note(s)</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Exporter CSV
          </button>
          <button onClick={openCreate} style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Saisir une note
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Moyenne classe', value: moyenne, sub: '/20', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Élèves évalués', value: String(nbEleves), sub: '', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Meilleure note', value: filtered.length > 0 ? String(meilleureNote) : '—', sub: '/20', color: '#16a34a', bg: '#dcfce7' },
          { label: 'Note minimale', value: filtered.length > 0 ? String(noteMin) : '—', sub: '/20', color: noteMin < 10 ? '#dc2626' : '#d97706', bg: noteMin < 10 ? '#fee2e2' : '#fef3c7' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}<span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{s.sub}</span></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', width: 260 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les classes</option>
          {(rawClasses as Record<string, unknown>[]).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? c.name ?? c.id)}</option>)}
        </select>
        <select value={filterMatiere} onChange={(e) => setFilterMatiere(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les matières</option>
          {(rawMatieres as Record<string, unknown>[]).map((m) => <option key={String(m.id)} value={String(m.id)}>{String(m.nom ?? m.name ?? m.id)}</option>)}
        </select>
        <select value={filterTrimestre} onChange={(e) => setFilterTrimestre(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les trimestres</option>
          <option value="1">Trimestre 1</option>
          <option value="2">Trimestre 2</option>
          <option value="3">Trimestre 3</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les types</option>
          <option value="DEVOIR">Devoir</option>
          <option value="COMPOSITION">Composition</option>
          <option value="EXAMEN">Examen</option>
          <option value="INTERROGATION">Interrogation</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px 80px 60px 100px 90px 80px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Élève', 'Matière', 'Classe', 'Type', 'Coeff', 'Note /20', 'Date', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune note trouvée</div>
          )}
          {filtered.map((n, idx) => {
            const tm = TYPE_MAP[n.type ?? ''] ?? { label: n.type ?? '—', bg: '#f1f5f9', color: '#64748b' };
            return (
              <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px 80px 60px 100px 90px 80px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{getEleveName(n)}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{getMatiereName(n)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{n.classe ?? '—'}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: tm.color, background: tm.bg, padding: '2px 8px', display: 'inline-block' }}>{tm.label}</span>
                <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>{n.coeff ?? 1}</div>
                <div style={{ fontSize: 16, ...getNoteStyle(n.note) }}>{n.note}<span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/20</span></div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{n.date ? new Date(n.date).toLocaleDateString('fr-FR') : '—'}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => openEdit(n)} style={{ width: 27, height: 27, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(n)} style={{ width: 27, height: 27, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier la note' : 'Saisir une note'}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Élève *</label>
              {rawEleves.length > 0 ? (
                <select value={form.eleveId} onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))} style={{ ...inp() }}>
                  <option value="">— Choisir un élève —</option>
                  {(rawEleves as Record<string, unknown>[]).map((el) => (
                    <option key={String(el.id)} value={String(el.id)}>{`${el.prenom ?? ''} ${el.nom ?? ''}`.trim()}</option>
                  ))}
                </select>
              ) : (
                <input value={form.eleveId} onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))} style={inp()} placeholder="ID de l'élève" />
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Matière *</label>
              {rawMatieres.length > 0 ? (
                <select value={form.matiereId} onChange={(e) => setForm((f) => ({ ...f, matiereId: e.target.value }))} style={{ ...inp() }}>
                  <option value="">— Choisir une matière —</option>
                  {(rawMatieres as Record<string, unknown>[]).map((m) => (
                    <option key={String(m.id)} value={String(m.id)}>{String(m.nom ?? m.name ?? m.id)}</option>
                  ))}
                </select>
              ) : (
                <input value={form.matiereId} onChange={(e) => setForm((f) => ({ ...f, matiereId: e.target.value }))} style={inp()} placeholder="ID de la matière" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inp() }}>
                  <option value="DEVOIR">Devoir</option>
                  <option value="COMPOSITION">Composition</option>
                  <option value="EXAMEN">Examen</option>
                  <option value="INTERROGATION">Interrogation</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Note /20 *</label>
                <input type="number" min="0" max="20" step="0.5" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} style={inp()} placeholder="Ex: 14.5" />
              </div>
              <div>
                <label style={lbl()}>Coefficient</label>
                <input type="number" min="1" max="5" value={form.coeff} onChange={(e) => setForm((f) => ({ ...f, coeff: e.target.value }))} style={inp()} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={lbl()}>Trimestre</label>
                <select value={form.trimestre} onChange={(e) => setForm((f) => ({ ...f, trimestre: e.target.value }))} style={{ ...inp() }}>
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp()} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Saisir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
