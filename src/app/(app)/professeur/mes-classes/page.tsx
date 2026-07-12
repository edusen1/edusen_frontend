'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';
const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#e11d48', '#0891b2', '#4f46e5', '#0d9488'];

type RawItem = R & { id: string; classeId?: string; classe?: R; matiere?: R; matiereNom?: string; effectif?: number; nbEleves?: number; moyenneClasse?: number; moyenne?: number; nom?: string };

type ClasseCard = {
  classeId: string;
  nom: string;
  niveau: string;
  effectif: number;
  heuresParSemaine: number;
  matieres: { id: string; nom: string }[];
};

export default function MesClassesPage() {
  const [rawClasses, setRawClasses] = useState<RawItem[]>([]);
  const [edt, setEdt] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [annees, setAnnees] = useState<{ id: string; libelle: string }[]>([]);
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterMatieres, setFilterMatieres] = useState<Set<string>>(new Set());

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, edtRes, anneesRes] = await Promise.all([
        apiClient.get('/professeur/mes-classes'),
        apiClient.get('/professeur/emploi-du-temps').catch(() => ({ data: [] })),
        apiClient.get('/v1/annees-academiques').catch(() => ({ data: [] })),
      ]);
      const d = classesRes.data;
      setRawClasses((Array.isArray(d) ? d : (d?.classes ?? d?.classesMatieres ?? d?.data ?? d?.content ?? [])) as RawItem[]);
      const edtData = edtRes.data;
      setEdt((Array.isArray(edtData) ? edtData : ((edtData as R)?.data ?? (edtData as R)?.content ?? [])) as R[]);
      // Années académiques
      const anneesData = anneesRes.data;
      const anneesArr = (Array.isArray(anneesData) ? anneesData : ((anneesData as R)?.data ?? (anneesData as R)?.content ?? [])) as R[];
      const mapped = anneesArr.map((a) => ({ id: String(a.id), libelle: String(a.libelle ?? a.nom ?? '') })).filter((a) => a.libelle);
      setAnnees(mapped);
      // Auto-select courante
      const courante = anneesArr.find((a) => a.actif || a.courante);
      if (courante && !filterAnnee) setFilterAnnee(String(courante.id));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchClasses(); }, [fetchClasses]);

  // Calculate hours per class + matieres per class from EDT
  const heuresParClasse = new Map<string, number>();
  const matieresParClasse = new Map<string, Map<string, string>>(); // classeId → Map<matiereId, matiereNom>
  for (const slot of edt) {
    const cid = String(slot.classeId ?? (slot.classe as R)?.id ?? '');
    const debut = String(slot.heureDebut ?? '');
    const fin = String(slot.heureFin ?? '');
    if (debut && fin) {
      const h1 = parseInt(debut.split(':')[0]) + parseInt(debut.split(':')[1] ?? '0') / 60;
      const h2 = parseInt(fin.split(':')[0]) + parseInt(fin.split(':')[1] ?? '0') / 60;
      heuresParClasse.set(cid, (heuresParClasse.get(cid) ?? 0) + Math.max(0, h2 - h1));
    }
    const mId = String(slot.matiereId ?? '');
    const mNom = String(slot.matiereLibelle ?? (slot.matiere as R)?.libelle ?? '');
    if (cid && mId && mNom) {
      if (!matieresParClasse.has(cid)) matieresParClasse.set(cid, new Map());
      matieresParClasse.get(cid)!.set(mId, mNom);
    }
  }

  // Filter by annee academique
  const filteredByAnnee = filterAnnee
    ? rawClasses.filter((item) => {
        const cl = (item.classe ?? item) as R;
        const anneeId = String((cl.anneeAcademique as R)?.id ?? cl.anneeAcademiqueId ?? item.anneeAcademiqueId ?? '');
        return anneeId === filterAnnee;
      })
    : rawClasses;

  // Deduplicate: group by classeId, merge matieres from API response + EDT fallback
  const classesMap = new Map<string, ClasseCard>();
  for (const item of filteredByAnnee) {
    const cl = (item.classe ?? item) as R;
    const cid = String(item.classeId ?? cl.id ?? item.id ?? '');
    const nom = String(cl.nom ?? item.nom ?? '');
    const niveau = String((cl.niveau as R)?.libelle ?? (cl.niveau as R)?.nom ?? '');
    const effectif = Number(item.effectif ?? item.nbEleves ?? (cl as R).nbEleves ?? 0);

    if (!classesMap.has(cid)) {
      // Matières from API response (matieresEnseignees from Cours)
      const mats: { id: string; nom: string }[] = [];
      const matEns = Array.isArray(item.matieresEnseignees) ? item.matieresEnseignees as R[] : [];
      for (const m of matEns) {
        const mId = String(m.id ?? '');
        const mNom = String(m.libelle ?? m.nom ?? m.code ?? '');
        if (mId && mNom) mats.push({ id: mId, nom: mNom });
      }
      // Fallback: matières from EDT if API didn't return any
      if (mats.length === 0) {
        const edtMats = matieresParClasse.get(cid);
        if (edtMats) { for (const [id, n] of edtMats) mats.push({ id, nom: n }); }
      }
      classesMap.set(cid, {
        classeId: cid, nom, niveau, effectif,
        heuresParSemaine: heuresParClasse.get(cid) ?? 0,
        matieres: mats,
      });
    } else {
      const existing = classesMap.get(cid)!;
      if (effectif > existing.effectif) existing.effectif = effectif;
    }
  }

  const classes = [...classesMap.values()];

  // All unique matieres across all classes
  const allMatieres = new Map<string, string>();
  for (const c of classes) {
    for (const m of c.matieres) {
      if (m.id && m.nom) allMatieres.set(m.id, m.nom);
    }
  }
  const matieresList = [...allMatieres.entries()].map(([id, nom]) => ({ id, nom }));

  const filtered = classes.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.nom.toLowerCase().includes(q) && !c.niveau.toLowerCase().includes(q) && !c.matieres.some((m) => m.nom.toLowerCase().includes(q))) return false;
    }
    if (filterMatieres.size > 0 && !c.matieres.some((m) => filterMatieres.has(m.id))) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes classes</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} classe(s)</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {annees.length > 0 && (
            <select value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff', flex: '1 1 140px' }}>
              <option value="">Toutes les années</option>
              {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          )}
          <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${B}`, padding: '0 10px', background: '#f8fafc' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: 12, height: 34, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
          </div>
        </div>
        {/* Filtre matières — checkboxes */}
        {matieresList.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Matières :</span>
            {matieresList.map((m) => {
              const active = filterMatieres.has(m.id);
              return (
                <label key={m.id} onClick={() => setFilterMatieres((prev) => { const next = new Set(prev); if (next.has(m.id)) next.delete(m.id); else next.add(m.id); return next; })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', border: `1px solid ${active ? '#2563eb' : B}`, background: active ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: active ? '#2563eb' : '#64748b' }}>
                  <div style={{ width: 14, height: 14, border: `2px solid ${active ? '#2563eb' : '#cbd5e1'}`, borderRadius: 3, background: active ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {m.nom}
                </label>
              );
            })}
            {filterMatieres.size > 0 && (
              <button onClick={() => setFilterMatieres(new Set())} style={{ fontSize: 10, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>Tout afficher</button>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            {classes.length === 0 ? 'Aucune classe assignée' : 'Aucun résultat'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map((c, idx) => {
              const accent = COLORS[idx % COLORS.length];
              return (
                <Link key={c.classeId} href={`/professeur/classe/${c.classeId}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: `1px solid ${B}`, cursor: 'pointer', padding: 20 }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-.01em' }}>{c.nom}</div>
                        {c.niveau && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.niveau}</div>}
                      </div>
                      {c.heuresParSemaine > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#0891b2', background: '#ecfeff', padding: '3px 9px' }}>{c.heuresParSemaine}h/sem</span>}
                    </div>

                    {/* Effectif */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 5 }}>
                        <span>{c.effectif} élève(s)</span>
                      </div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: accent, width: `${Math.min(100, Math.max(10, c.effectif * 2))}%` }} />
                      </div>
                    </div>

                    {/* Matieres badges */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                      {c.matieres.map((m, mi) => {
                        const highlight = filterMatieres.size === 0 || filterMatieres.has(m.id);
                        return (
                          <span key={mi} style={{ fontSize: 10, fontWeight: 600, color: highlight ? COLORS[mi % COLORS.length] : '#cbd5e1', background: highlight ? COLORS[mi % COLORS.length] + '15' : '#f8fafc', padding: '2px 8px', border: `1px solid ${highlight ? COLORS[mi % COLORS.length] + '30' : '#e2e8f0'}` }}>
                            {m.nom}
                          </span>
                        );
                      })}
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>Voir détails →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
