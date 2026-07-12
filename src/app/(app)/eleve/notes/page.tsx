'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { calculerMoyenne } from '@/lib/calcul-moyenne';

type R = Record<string, unknown>;
const B = '#e6ebf1';
function nc(n: number) { return n >= 14 ? '#16a34a' : n >= 10 ? '#d97706' : '#dc2626'; }
const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#be185d'];
const TYPE_LABELS: Record<string, string> = { DEVOIR: 'Devoir', COMPOSITION: 'Composition', EXAMEN: 'Examen', BONUS: 'Bonus', INTERROGATION: 'Interrogation', CONTROLE: 'Contrôle' };

export default function EleveNotesPage() {
  const [notes, setNotes] = useState<R[]>([]);
  const [annees, setAnnees] = useState<{ id: string; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('');
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [typePeriode, setTypePeriode] = useState('TRIMESTRE');
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, profilRes, anneesRes] = await Promise.all([
        apiClient.get('/eleve/notes', { params: { trimestre: periode || undefined, anneeScolaire: filterAnnee || undefined } }),
        apiClient.get('/eleve/profil').catch(() => ({ data: {} })),
        apiClient.get('/v1/annees-academiques').catch(() => ({ data: [] })),
      ]);
      const nd = notesRes.data as R;
      setNotes(Array.isArray(nd?.notes) ? nd.notes as R[] : Array.isArray(nd) ? nd : []);
      const profil = (profilRes.data ?? {}) as R;
      const cycle = ((profil.classe as R)?.niveau as R)?.cycle as R | undefined;
      const tp = String(cycle?.typePeriode ?? 'TRIMESTRE');
      setTypePeriode(tp);
      if (!periode) setPeriode(tp === 'SEMESTRE' ? 'SEMESTRE_1' : 'TRIMESTRE_1');
      // Années
      const ad = anneesRes.data;
      const aList = (Array.isArray(ad) ? ad : ((ad as R)?.data ?? [])) as R[];
      setAnnees(aList.map((a) => ({ id: String(a.id), libelle: String(a.libelle ?? '') })));
      if (!filterAnnee) {
        const courante = aList.find((a) => a.actif || a.estCourante || a.courante);
        if (courante) setFilterAnnee(String(courante.libelle ?? ''));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [periode, filterAnnee]);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  // Group by matière
  const matMap = new Map<string, { id: string; nom: string; notes: R[] }>();
  for (const n of notes) {
    const mat = n.matiere as R | undefined;
    const mId = String(n.matiereId ?? mat?.id ?? '');
    const mNom = String(mat?.libelle ?? mat?.nom ?? n.matiereLibelle ?? '—');
    if (!matMap.has(mId)) matMap.set(mId, { id: mId, nom: mNom, notes: [] });
    matMap.get(mId)!.notes.push(n);
  }
  const matieres = [...matMap.values()];

  // Calcul par matière
  const lignes = matieres.map((m, idx) => {
    const devoirs = m.notes.filter((n) => { const t = String(n.typeEvaluation ?? '').toUpperCase(); return ['DEVOIR', 'INTERROGATION', 'CONTROLE'].includes(t); });
    const compos = m.notes.filter((n) => { const t = String(n.typeEvaluation ?? '').toUpperCase(); return ['COMPOSITION', 'EXAMEN'].includes(t); });
    const bonus = m.notes.filter((n) => String(n.typeEvaluation ?? '').toUpperCase() === 'BONUS');
    const calc = calculerMoyenne(
      devoirs.map((n) => Number(n.valeur ?? n.note ?? 0)),
      compos.length > 0 ? Number(compos[0].valeur ?? compos[0].note ?? 0) : null,
      bonus.reduce((s, n) => s + Number(n.valeur ?? n.note ?? 0), 0),
    );
    return { ...m, devoirs, compos, bonus, calc, color: COLORS[idx % COLORS.length] };
  });

  const moyValues = lignes.filter((l) => l.calc.hasNotes).map((l) => l.calc.moyenneGenerale);
  const moyGenerale = moyValues.length > 0 ? moyValues.reduce((s, v) => s + v, 0) / moyValues.length : null;

  const periodes = typePeriode === 'SEMESTRE'
    ? [{ key: 'SEMESTRE_1', label: 'Sem. 1' }, { key: 'SEMESTRE_2', label: 'Sem. 2' }]
    : [{ key: 'TRIMESTRE_1', label: 'Trim. 1' }, { key: 'TRIMESTRE_2', label: 'Trim. 2' }, { key: 'TRIMESTRE_3', label: 'Trim. 3' }];

  const filteredLignes = lignes.filter((l) => !filterMatiere || l.id === filterMatiere);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes notes</div>
          {/* Filtre année */}
          {annees.length > 1 && (
            <select value={filterAnnee} onChange={(e) => { setFilterAnnee(e.target.value); setNotes([]); }}
              style={{ height: 30, border: `1px solid ${B}`, padding: '0 8px', fontSize: 11, fontFamily: 'inherit', background: '#fff', marginLeft: 'auto' }}>
              {annees.map((a) => <option key={a.id} value={a.libelle}>{a.libelle}</option>)}
            </select>
          )}
        </div>
        {/* Périodes */}
        <div style={{ display: 'flex', gap: 0 }}>
          {periodes.map((p) => (
            <button key={p.key} onClick={() => setPeriode(p.key)}
              style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: periode === p.key ? 700 : 400, color: periode === p.key ? '#2563eb' : '#94a3b8', border: 'none', borderBottom: periode === p.key ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {/* Moyenne + stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: '#0f172a', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Moyenne</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: moyGenerale !== null ? nc(moyGenerale) : '#fff', lineHeight: 1.1 }}>
              {moyGenerale !== null ? moyGenerale.toFixed(1) : '—'}<span style={{ fontSize: 12, color: '#64748b' }}>/20</span>
            </div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>Matières</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{matieres.length}</div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>Notes</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{notes.length}</div>
          </div>
        </div>

        {/* Filtre matière */}
        {matieres.length > 1 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterMatiere('')} style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', border: `1px solid ${!filterMatiere ? '#2563eb' : B}`, background: !filterMatiere ? '#eff6ff' : '#fff', color: !filterMatiere ? '#2563eb' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Toutes</button>
            {matieres.map((m) => (
              <button key={m.id} onClick={() => setFilterMatiere(filterMatiere === m.id ? '' : m.id)}
                style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', border: `1px solid ${filterMatiere === m.id ? '#2563eb' : B}`, background: filterMatiere === m.id ? '#eff6ff' : '#fff', color: filterMatiere === m.id ? '#2563eb' : '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                {m.nom}
              </button>
            ))}
          </div>
        )}

        {/* Liste matières */}
        {loading ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chargement...</div>
        ) : filteredLignes.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune note pour cette période</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredLignes.map((l) => {
              const expanded = expandedMatiere === l.id;
              return (
                <div key={l.id} style={{ background: '#fff', border: `1px solid ${B}`, overflow: 'hidden' }}>
                  {/* Header matière — cliquable */}
                  <div onClick={() => setExpandedMatiere(expanded ? null : l.id)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 32, background: l.color, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{l.nom}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {l.devoirs.length} devoir(s) · {l.compos.length} compo · {l.bonus.length > 0 ? `+${l.bonus.reduce((s, n) => s + Number(n.valeur ?? n.note ?? 0), 0)} bonus` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: l.calc.hasNotes ? nc(l.calc.moyenneGenerale) : '#94a3b8' }}>
                        {l.calc.hasNotes ? l.calc.moyenneGenerale.toFixed(1) : '—'}
                      </div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>/20</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>

                  {/* Détail — expanded */}
                  {expanded && (
                    <div style={{ borderTop: `1px solid #f1f5f9`, padding: '10px 14px' }}>
                      {/* Décomposition */}
                      {l.calc.hasNotes && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          <div style={{ background: '#f8fafc', border: `1px solid #f1f5f9`, padding: '6px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Devoirs</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: nc(l.calc.moyenneDevoirsBonifiee) }}>{l.calc.moyenneDevoirsBonifiee.toFixed(1)}</div>
                          </div>
                          <div style={{ background: '#f8fafc', border: `1px solid #f1f5f9`, padding: '6px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#94a3b8' }}>Composition</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: nc(l.calc.noteCompositionBonifiee) }}>{l.calc.noteCompositionBonifiee.toFixed(1)}</div>
                          </div>
                          {l.calc.bonusApplique > 0 && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#16a34a' }}>Bonus</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>+{l.calc.bonusApplique}</div>
                            </div>
                          )}
                          {l.calc.bonusPerdu > 0 && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 12px', textAlign: 'center' }}>
                              <div style={{ fontSize: 9, color: '#dc2626' }}>Perdu</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{l.calc.bonusPerdu}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Liste de toutes les notes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {l.notes.map((n, ni) => {
                          const val = Number(n.valeur ?? n.note ?? 0);
                          const sur = Number(n.noteSur ?? 20);
                          const type = String(n.typeEvaluation ?? '');
                          const date = n.createdAt ? new Date(String(n.createdAt)).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
                          return (
                            <div key={ni} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: ni < l.notes.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: type === 'BONUS' ? '#16a34a' : '#2563eb', background: type === 'BONUS' ? '#f0fdf4' : '#eff6ff', padding: '1px 6px', border: `1px solid ${type === 'BONUS' ? '#bbf7d0' : '#bfdbfe'}`, flexShrink: 0 }}>
                                {TYPE_LABELS[type] ?? type}
                              </span>
                              <span style={{ flex: 1, fontSize: 11, color: '#64748b' }}>{date}</span>
                              <span style={{ fontSize: 15, fontWeight: 700, color: type === 'BONUS' ? '#16a34a' : nc(val) }}>
                                {type === 'BONUS' ? `+${val}` : `${val}/${sur}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
