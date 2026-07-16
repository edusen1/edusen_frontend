'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAdminMatieres, useCreateMatiere, useUpdateMatiere, useDeleteMatiere } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

const CATEGORIES = [
  'Mathématiques', 'Sciences', 'Lettres', 'Langues',
  'Sciences Humaines', 'Arts', 'Technologie', 'Sport', 'Religion', 'Autre',
];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Mathématiques': { bg: '#eff6ff', color: '#2563eb' },
  'Sciences':      { bg: '#ecfdf5', color: '#059669' },
  'Lettres':       { bg: '#fdf4ff', color: '#9333ea' },
  'Langues':       { bg: '#fff7ed', color: '#ea580c' },
  'Sciences Humaines': { bg: '#f0fdf4', color: '#16a34a' },
  'Arts':          { bg: '#fef9c3', color: '#ca8a04' },
  'Technologie':   { bg: '#f0f9ff', color: '#0284c7' },
  'Sport':         { bg: '#fef2f2', color: '#dc2626' },
  'Religion':      { bg: '#fafaf9', color: '#78716c' },
  'Autre':         { bg: '#f8fafc', color: '#64748b' },
};

type MatiereItem = Record<string, unknown>;

type Affectation = {
  classeNom: string;
  niveauNom: string;
  enseignantNom: string;
  anneeScolaire: string;
  volumeHoraire?: number | null;
};

export default function MatieresPage() {
  const { data, isLoading } = useAdminMatieres();
  const response = data as Record<string, unknown> | undefined;
  const rawMatieres = Array.isArray(data) ? data : (response?.content ?? response?.data);
  const matieres: MatiereItem[] = Array.isArray(rawMatieres) ? rawMatieres : [];

  const createMatiere = useCreateMatiere();
  const updateMatiere = useUpdateMatiere();
  const deleteMatiere = useDeleteMatiere();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterActif, setFilterActif] = useState('actif');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MatiereItem | null>(null);
  const [form, setForm] = useState({ libelle: '', code: '', categorie: '', description: '' });

  // Drawer détail
  const [detailItem, setDetailItem] = useState<MatiereItem | null>(null);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [affLoading, setAffLoading] = useState(false);
  const [affAnnee, setAffAnnee] = useState('');

  const filtered = matieres.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchQ = !q
      || ((m.libelle ?? '') as string).toLowerCase().includes(q)
      || ((m.code ?? '') as string).toLowerCase().includes(q);
    const matchCat = !filterCat || m.categorie === filterCat;
    const actif = m.actif !== false;
    const matchActif = !filterActif || (filterActif === 'actif' ? actif : !actif);
    return matchQ && matchCat && matchActif;
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ libelle: '', code: '', categorie: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (m: MatiereItem) => {
    setEditItem(m);
    setForm({
      libelle:     (m.libelle ?? '') as string,
      code:        (m.code ?? '') as string,
      categorie:   (m.categorie ?? '') as string,
      description: (m.description ?? '') as string,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.libelle.trim() || !form.code.trim()) {
      toast.error('Libellé et code sont requis'); return;
    }
    try {
      if (editItem) {
        await updateMatiere.mutateAsync({ id: String(editItem.id), data: form });
      } else {
        await createMatiere.mutateAsync(form);
      }
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (m: MatiereItem) => {
    if (!confirm(`Supprimer la matière "${m.libelle}" ?`)) return;
    try {
      await deleteMatiere.mutateAsync(String(m.id));
    } catch { /* handled by hook */ }
  };

  const openDetail = useCallback(async (m: MatiereItem) => {
    setDetailItem(m);
    setAffectations([]);
    setAffAnnee('');
    setAffLoading(true);
    try {
      const mId = String(m.id);
      const [mcRes, clRes] = await Promise.allSettled([
        apiClient.get('/admin/matieres-classes', { params: { size: 500 } }),
        apiClient.get('/admin/classes', { params: { size: 500 } }),
      ]);
      const extract = (r: PromiseSettledResult<{ data: unknown }>) => {
        if (r.status !== 'fulfilled') return [] as Record<string, unknown>[];
        const d = r.value.data as Record<string, unknown>;
        return (Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as Record<string, unknown>[];
      };
      const allMC      = extract(mcRes);
      const allClasses = extract(clRes);

      const classeIdx: Record<string, Record<string, unknown>> = {};
      for (const c of allClasses) classeIdx[String(c.id ?? '')] = c;

      const rows: Affectation[] = allMC
        .filter((mc) => String(mc.matiereId ?? '') === mId)
        .map((mc) => {
          const classe  = classeIdx[String(mc.classeId ?? '')] ?? {};
          const niveau  = classe.niveau as Record<string, unknown> | undefined;
          const ens     = mc.enseignant as Record<string, unknown> | undefined;
          const nom = `${ens?.firstName ?? ens?.prenom ?? ''} ${ens?.lastName ?? ens?.nom ?? ''}`.trim();
          return {
            classeNom:     String(classe.nom ?? '—'),
            niveauNom:     String(niveau?.libelle ?? niveau?.nom ?? ''),
            enseignantNom: nom,
            anneeScolaire: String(mc.anneeScolaire ?? ''),
            volumeHoraire: mc.volumeHoraire as number | null | undefined,
          };
        });

      setAffectations(rows);
    } catch { setAffectations([]); }
    finally { setAffLoading(false); }
  }, []);

  const catColors = (cat: string) => CAT_COLORS[cat] ?? { bg: '#f8fafc', color: '#64748b' };

  const usedCats = Array.from(new Set(matieres.map((m) => String(m.categorie ?? '')).filter(Boolean))).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Matières</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} matière{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 40, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nouvelle matière
        </button>
      </div>

      {/* Filtres */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', flex: 1, minWidth: 200, maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Libellé, code…" style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', width: '100%', height: 38, fontFamily: 'inherit' }} />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', minWidth: 170 }}>
          <option value="">Toutes les catégories</option>
          {usedCats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterActif} onChange={(e) => setFilterActif(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actives</option>
          <option value="inactif">Inactives</option>
        </select>
      </div>

      {/* Grille */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucune matière trouvée</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map((m) => {
              const libelle  = String(m.libelle ?? '');
              const code     = String(m.code ?? '');
              const cat      = String(m.categorie ?? '');
              const desc     = String(m.description ?? '');
              const actif    = m.actif !== false;
              const { bg, color } = catColors(cat);
              return (
                <div
                  key={String(m.id)}
                  onClick={() => openDetail(m)}
                  style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e6ebf1')}
                >
                  {/* En-tête */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{libelle}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                        {cat && <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 7px' }}>{cat}</span>}
                        <span style={{ fontSize: 10, fontWeight: 700, color: actif ? '#16a34a' : '#94a3b8', background: actif ? '#dcfce7' : '#f1f5f9', padding: '2px 7px' }}>{actif ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '3px 9px', flexShrink: 0, marginLeft: 8 }}>{code}</span>
                  </div>

                  {desc && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{desc}</div>}

                  {/* Actions */}
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <button onClick={() => openEdit(m)} style={{ flex: 1, height: 30, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(m)} disabled={deleteMatiere.isPending} style={{ width: 30, height: 30, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Drawer détail ── */}
      {detailItem && (() => {
        const m       = detailItem;
        const libelle = String(m.libelle ?? '');
        const code    = String(m.code ?? '');
        const cat     = String(m.categorie ?? '');
        const desc    = String(m.description ?? '');
        const actif   = m.actif !== false;
        const { bg, color } = catColors(cat);

        const annees = Array.from(new Set(affectations.map((a) => a.anneeScolaire).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));
        const displayAff = affAnnee ? affectations.filter((a) => a.anneeScolaire === affAnnee) : affectations;

        return (
          <>
            <div onClick={() => setDetailItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 60 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: '#fff', boxShadow: '-8px 0 40px rgba(15,23,42,.18)', zIndex: 61, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ flexShrink: 0, padding: '20px 24px 18px', borderBottom: '1px solid #e6ebf1', background: '#f8fafc', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, flexShrink: 0, background: bg, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color }}>{code.slice(0, 3)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{libelle}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {cat && <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 7px' }}>{cat}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, color: actif ? '#16a34a' : '#94a3b8', background: actif ? '#dcfce7' : '#f1f5f9', padding: '2px 7px' }}>{actif ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <button onClick={() => setDetailItem(null)} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
                {/* Infos */}
                {desc && (
                  <div style={{ marginBottom: 22, fontSize: 13, color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px 14px', border: '1px solid #e6ebf1' }}>
                    {desc}
                  </div>
                )}

                {/* Affectations */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>
                    Affectations ({affectations.length})
                  </div>

                  {/* Filtre année */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>Année scolaire</label>
                    <select
                      value={affAnnee}
                      onChange={(e) => setAffAnnee(e.target.value)}
                      style={{ height: 34, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', width: '100%' }}
                    >
                      <option value="">Toutes les années ({affectations.length})</option>
                      {annees.map((a) => (
                        <option key={a} value={a}>{a} ({affectations.filter((x) => x.anneeScolaire === a).length})</option>
                      ))}
                    </select>
                  </div>

                  {affLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
                  ) : displayAff.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                      {affectations.length === 0 ? 'Aucune affectation trouvée' : 'Aucune affectation pour cette année'}
                    </div>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                      {displayAff.map((a, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: idx < displayAff.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                          <div style={{ width: 34, height: 34, background: bg, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.classeNom}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              {a.enseignantNom && <span>{a.enseignantNom}</span>}
                              {a.niveauNom && <span>{a.enseignantNom ? ' · ' : ''}{a.niveauNom}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {a.anneeScolaire && <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 7px' }}>{a.anneeScolaire}</div>}
                            {a.volumeHoraire != null && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{a.volumeHoraire}h/sem</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action modifier */}
                <div style={{ marginTop: 22 }}>
                  <button onClick={() => { setDetailItem(null); openEdit(m); }} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Modifier la matière
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier la matière' : 'Nouvelle matière'}
            </div>
            {[
              { label: 'Libellé', key: 'libelle', placeholder: 'Ex: Mathématiques', required: true },
              { label: 'Code', key: 'code', placeholder: 'Ex: MATH', required: true },
              { label: 'Description', key: 'description', placeholder: 'Brève description…', required: false },
            ].map(({ label, key, placeholder, required }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                  {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
                </label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Catégorie</label>
              <select value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">— Sélectionner —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={createMatiere.isPending || updateMatiere.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createMatiere.isPending || updateMatiere.isPending) ? 0.7 : 1 }}>
                {(createMatiere.isPending || updateMatiere.isPending) ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
