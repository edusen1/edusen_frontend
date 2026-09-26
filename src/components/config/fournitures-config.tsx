'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const CYCLES_AVEC_SERIE = ['COLLEGE', 'LYCEE', 'SECONDAIRE'];
const SERIES = ['L1', 'L1A', 'L1B', "L'1", 'L2', 'LA', 'S1', 'S2', 'S3', 'S4', 'S5', 'STEG', 'G', 'T1', 'T2', 'F6'];

interface Fourniture {
  id: string;
  nom: string;
  quantite: number;
  description: string | null;
  obligatoire: boolean;
  ordre: number;
  serie: string | null;
}

interface Niveau {
  id: string;
  libelle: string;
  code: string;
  ordre: number;
  fournitures: Fourniture[];
}

interface Cycle {
  id: string;
  libelle: string;
  code: string;
  ordre: number;
  niveaux: Niveau[];
}

const VIDE = { nom: '', quantite: '1', description: '', obligatoire: true, ordre: '0', serie: '' };

const inp: React.CSSProperties = {
  width: '100%', height: 30, border: '1px solid #d9e0e8',
  padding: '0 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export function FournituresConfig() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [modal, setModal] = useState<{ niveauId: string; cycleCode: string; item?: Fourniture } | null>(null);
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    apiClient.get('/configuration/fournitures')
      .then((r) => {
        const data: Cycle[] = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        setCycles(data);
        setCycleId((prev) => prev ?? data[0]?.id ?? null);
      })
      .catch(() => toast.error('Impossible de charger les fournitures'))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const cycle = cycles.find((c) => c.id === cycleId) ?? null;
  const avecSerie = CYCLES_AVEC_SERIE.includes(cycle?.code ?? '');

  const ouvrir = (niveauId: string, cycleCode: string, item?: Fourniture) => {
    setForm(item
      ? { nom: item.nom, quantite: String(item.quantite), description: item.description ?? '', obligatoire: item.obligatoire, ordre: String(item.ordre), serie: item.serie ?? '' }
      : VIDE
    );
    setModal({ niveauId, cycleCode, item });
  };

  const enregistrer = async () => {
    if (!modal || !form.nom.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    const payload = {
      niveauId: modal.niveauId,
      nom: form.nom.trim(),
      quantite: Number(form.quantite) || 1,
      description: form.description.trim() || null,
      obligatoire: form.obligatoire,
      ordre: Number(form.ordre) || 0,
      serie: CYCLES_AVEC_SERIE.includes(modal.cycleCode) ? (form.serie || null) : null,
    };
    try {
      if (modal.item) {
        await apiClient.put(`/configuration/fournitures/${modal.item.id}`, payload);
        toast.success('Fourniture modifiée');
      } else {
        await apiClient.post('/configuration/fournitures', payload);
        toast.success('Fourniture ajoutée');
      }
      setModal(null);
      charger();
    } catch { toast.error('Enregistrement impossible'); }
    setSaving(false);
  };

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await apiClient.delete(`/configuration/fournitures/${id}`);
      toast.success('Fourniture supprimée');
      charger();
    } catch { toast.error('Suppression impossible'); }
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;
  if (cycles.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun cycle configuré.</div>;

  const cols = avecSerie ? '1fr 60px 72px 90px 1fr 110px' : '1fr 60px 90px 1fr 110px';
  const headers = avecSerie ? ['Article', 'Qté', 'Série', 'Obligatoire', 'Remarque', ''] : ['Article', 'Qté', 'Obligatoire', 'Remarque', ''];

  return (
    <div>
      {/* ── Onglets cycles ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e6ebf1', marginBottom: 24 }}>
        {cycles.map((c) => {
          const total = (c.niveaux ?? []).reduce((s, n) => s + (n.fournitures ?? []).length, 0);
          const actif = c.id === cycleId;
          return (
            <button key={c.id} onClick={() => setCycleId(c.id)} style={{
              height: 38, padding: '0 18px', border: 'none', background: 'none', fontFamily: 'inherit',
              fontSize: 13, fontWeight: actif ? 700 : 500,
              color: actif ? '#2563eb' : '#64748b',
              borderBottom: actif ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {c.libelle}
              {total > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, background: actif ? '#dbeafe' : '#f1f5f9', color: actif ? '#2563eb' : '#64748b', padding: '1px 6px', fontWeight: 700 }}>
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Niveaux du cycle actif ── */}
      {cycle && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(cycle.niveaux ?? []).map((niveau) => {
            const fours = niveau.fournitures ?? [];
            return (
              <div key={niveau.id} style={{ border: '1px solid #e6ebf1', background: '#fff' }}>
                {/* En-tête niveau */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid #e6ebf1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{niveau.libelle}</span>
                    <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '1px 7px', fontWeight: 600 }}>{niveau.code}</span>
                    {fours.length > 0 && (
                      <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '1px 7px', fontWeight: 700 }}>
                        {fours.length} article{fours.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <button onClick={() => ouvrir(niveau.id, cycle.code)}
                    style={{ height: 28, padding: '0 11px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    + Ajouter
                  </button>
                </div>

                {/* Liste des fournitures */}
                {fours.length === 0 ? (
                  <div style={{ padding: '13px 18px', color: '#94a3b8', fontSize: 12 }}>
                    Aucune fourniture pour ce niveau.
                  </div>
                ) : (
                  <>
                    {/* En-tête colonnes */}
                    <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '7px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                      {headers.map((h) => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
                      ))}
                    </div>
                    {/* Lignes */}
                    {fours.map((f, i) => (
                      <div key={f.id} style={{
                        display: 'grid', gridTemplateColumns: cols,
                        padding: '9px 18px', alignItems: 'center',
                        borderBottom: i < fours.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.nom}</span>
                        <span style={{ fontSize: 13, color: '#334155' }}>{f.quantite}</span>
                        {avecSerie && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: f.serie ? '#7c3aed' : '#94a3b8', background: f.serie ? '#f5f3ff' : '#f1f5f9', padding: '1px 6px', width: 'fit-content' }}>
                            {f.serie ?? 'Toutes'}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.obligatoire ? '#16a34a' : '#64748b', background: f.obligatoire ? '#dcfce7' : '#f1f5f9', padding: '1px 6px', width: 'fit-content' }}>
                          {f.obligatoire ? 'Obligatoire' : 'Facultatif'}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{f.description ?? '—'}</span>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => ouvrir(niveau.id, cycle.code, f)}
                            style={{ height: 26, padding: '0 9px', fontSize: 11, fontWeight: 600, color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Modifier
                          </button>
                          <button onClick={() => void supprimer(f.id, f.nom)}
                            style={{ height: 26, padding: '0 9px', fontSize: 11, fontWeight: 600, color: '#dc2626', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6ebf1', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {modal.item ? 'Modifier la fourniture' : 'Ajouter une fourniture'}
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="ex. Cahier grand format" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Quantité</label>
                  <input type="number" min={1} value={form.quantite} onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Ordre d&apos;affichage</label>
                  <input type="number" min={0} value={form.ordre} onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))} style={inp} />
                </div>
              </div>
              {CYCLES_AVEC_SERIE.includes(modal.cycleCode) && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Série (optionnel)</label>
                  <select value={form.serie} onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))}
                    style={{ ...inp, height: 30, background: '#fff' }}>
                    <option value="">Toutes les séries</option>
                    {SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Laisser vide = fourniture commune à toutes les séries.</div>
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Remarque (optionnel)</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="ex. Couverture bleue" style={inp} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.obligatoire} onChange={(e) => setForm((f) => ({ ...f, obligatoire: e.target.checked }))} style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 13, color: '#334155' }}>Obligatoire</span>
              </label>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)}
                style={{ height: 32, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => void enregistrer()} disabled={saving}
                style={{ height: 32, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : modal.item ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
