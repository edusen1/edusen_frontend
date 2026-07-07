'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminConvocations, useAdminEleves, useCreateConvocation, useUpdateConvocation } from '@/hooks/use-query-api';

const STATIC_CONVOCATIONS = [
  { id: 'c1', eleveNom: 'Awa Ndiaye', eleveClasse: '3ème B', type: 'DISCIPLINAIRE', dateConvocation: '2026-06-30', motif: 'Comportement perturbateur en classe', statut: 'CONVOQUE', compteRendu: null },
  { id: 'c2', eleveNom: 'Cheikh Sarr', eleveClasse: '4ème A', type: 'ACADEMIQUE', dateConvocation: '2026-07-02', motif: 'Résultats insuffisants au premier trimestre', statut: 'EN_ATTENTE', compteRendu: null },
  { id: 'c3', eleveNom: 'Fatou Bâ', eleveClasse: '3ème B', type: 'ADMINISTRATIF', dateConvocation: '2026-06-25', motif: 'Dossier incomplet — documents manquants', statut: 'CLOTURE', compteRendu: 'Réunion effectuée. Dossier complété le 25/06.' },
  { id: 'c4', eleveNom: 'Ibrahima Fall', eleveClasse: '5ème A', type: 'DISCIPLINAIRE', dateConvocation: '2026-07-05', motif: 'Absence répétée et non justifiée', statut: 'EN_ATTENTE', compteRendu: null },
  { id: 'c5', eleveNom: 'Mariama Diop', eleveClasse: '4ème B', type: 'ACADEMIQUE', dateConvocation: '2026-06-28', motif: 'Tutorat pour les examens de fin d\'année', statut: 'CONVOQUE', compteRendu: null },
];

type Convocation = {
  id: string;
  eleveNom?: string;
  eleveClasse?: string;
  eleveId?: string;
  type: string;
  dateConvocation: string;
  motif: string;
  statut: string;
  compteRendu?: string | null;
  observations?: string;
};

const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  DISCIPLINAIRE: { label: 'Disciplinaire', bg: '#fee2e2', color: '#dc2626' },
  ACADEMIQUE: { label: 'Académique', bg: '#fef3c7', color: '#d97706' },
  ADMINISTRATIF: { label: 'Administratif', bg: '#eff6ff', color: '#2563eb' },
};

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  CONVOQUE: { label: 'Convoqué', bg: '#dbeafe', color: '#2563eb' },
  CLOTURE: { label: 'Clôturé', bg: '#f1f5f9', color: '#64748b' },
};

const EMPTY_FORM = { eleveId: '', eleveNom: '', type: 'DISCIPLINAIRE', dateConvocation: '', motif: '', observations: '' };

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

function getEleve(c: Convocation): string {
  if (c.eleveNom) return c.eleveNom;
  if (typeof c.eleveId === 'object' && c.eleveId && 'nom' in (c.eleveId as object)) {
    const e = c.eleveId as Record<string, string>;
    return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
  }
  return String(c.eleveId ?? '');
}

function getClasse(c: Convocation): string {
  if (c.eleveClasse) return c.eleveClasse;
  return '';
}

export default function ConvocationsPage() {
  const { data } = useAdminConvocations();
  const { data: elevesData } = useAdminEleves();
  const rawList = Array.isArray(data) ? data : (data?.convocations ?? data?.data ?? []);
  const convocations: Convocation[] = rawList.length > 0 ? rawList : STATIC_CONVOCATIONS;

  const rawEleves = Array.isArray(elevesData) ? elevesData : (elevesData?.eleves ?? elevesData?.data ?? []);

  const createConvocation = useCreateConvocation();
  const updateConvocation = useUpdateConvocation();

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [showCR, setShowCR] = useState(false);
  const [crId, setCrId] = useState<string | null>(null);
  const [crText, setCrText] = useState('');
  const [savingCR, setSavingCR] = useState(false);

  const filtered = convocations.filter((c) => {
    const name = getEleve(c).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || c.motif.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || c.statut === filterStatut;
    const matchType = !filterType || c.type === filterType;
    return matchSearch && matchStatut && matchType;
  });

  const nbTotal = convocations.length;
  const nbConvoques = convocations.filter((c) => c.statut === 'CONVOQUE').length;
  const nbAvecCR = convocations.filter((c) => c.compteRendu).length;
  const nbClotures = convocations.filter((c) => c.statut === 'CLOTURE').length;

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Convocation) => {
    setEditId(c.id);
    setForm({
      eleveId: String(c.eleveId ?? ''),
      eleveNom: getEleve(c),
      type: c.type,
      dateConvocation: c.dateConvocation?.slice(0, 10) ?? '',
      motif: c.motif,
      observations: c.observations ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.motif.trim() || !form.dateConvocation) {
      toast.error('Motif et date de convocation sont requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        eleveId: form.eleveId || undefined,
        type: form.type,
        dateConvocation: form.dateConvocation,
        motif: form.motif.trim(),
        observations: form.observations.trim() || undefined,
      };
      if (editId) {
        await updateConvocation.mutateAsync({ id: editId, data: payload });
      } else {
        await createConvocation.mutateAsync(payload);
      }
      setShowModal(false);
    } catch {
      /* hook handles toast */
    } finally {
      setSaving(false);
    }
  };

  const handleCloturer = async (c: Convocation) => {
    if (!confirm(`Clôturer la convocation de "${getEleve(c)}" ?`)) return;
    try {
      await updateConvocation.mutateAsync({ id: c.id, data: { statut: 'CLOTURE' } });
    } catch {
      /* hook handles toast */
    }
  };

  const openCR = (c: Convocation) => {
    setCrId(c.id);
    setCrText(c.compteRendu ?? '');
    setShowCR(true);
  };

  const handleSaveCR = async () => {
    if (!crId) return;
    setSavingCR(true);
    try {
      await updateConvocation.mutateAsync({ id: crId, data: { compteRendu: crText } });
      setShowCR(false);
    } catch {
      /* hook handles toast */
    } finally {
      setSavingCR(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Convocations</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{convocations.length} convocation(s)</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle convocation
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Total', count: nbTotal, bg: '#eff6ff', color: '#2563eb' },
          { label: 'Convoqués', count: nbConvoques, bg: '#dbeafe', color: '#1d4ed8' },
          { label: 'Avec compte-rendu', count: nbAvecCR, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Clôturées', count: nbClotures, bg: '#f1f5f9', color: '#64748b' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</span>
            </span>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève ou motif…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="CONVOQUE">Convoqué</option>
          <option value="CLOTURE">Clôturé</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les types</option>
          <option value="DISCIPLINAIRE">Disciplinaire</option>
          <option value="ACADEMIQUE">Académique</option>
          <option value="ADMINISTRATIF">Administratif</option>
        </select>
        {(search || filterStatut || filterType) && (
          <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterType(''); }} style={{ height: 38, padding: '0 12px', border: '1px solid #d9e0e8', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 110px 110px 180px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Élève', 'Type', 'Date', 'Statut', 'Compte-rendu', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune convocation trouvée</div>
          )}
          {filtered.map((c, idx) => {
            const tm = TYPE_MAP[c.type] ?? TYPE_MAP.DISCIPLINAIRE;
            const sm = STATUT_MAP[c.statut] ?? STATUT_MAP.EN_ATTENTE;
            const isCloture = c.statut === 'CLOTURE';
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 110px 110px 180px', padding: '14px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{getEleve(c)}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{getClasse(c)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.motif}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: tm.color, background: tm.bg, padding: '3px 8px', display: 'inline-block' }}>{tm.label}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{fmtDate(c.dateConvocation)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: '3px 8px', display: 'inline-block' }}>{sm.label}</span>
                <div>
                  {c.compteRendu ? (
                    <button onClick={() => openCR(c)} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>Voir CR</button>
                  ) : (
                    <button onClick={() => openCR(c)} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Ajouter CR</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(c)} style={{ height: 28, padding: '0 8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Modifier
                  </button>
                  {!isCloture && (
                    <button onClick={() => handleCloturer(c)} style={{ height: 28, padding: '0 8px', border: '1px solid #d1fae5', background: '#f0fdf4', fontSize: 11, color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 520, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier la convocation' : 'Nouvelle convocation'}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Élève *</label>
              {rawEleves.length > 0 ? (
                <select
                  value={form.eleveId}
                  onChange={(e) => {
                    const el = rawEleves.find((x: Record<string, unknown>) => String(x.id) === e.target.value);
                    setForm((f) => ({ ...f, eleveId: e.target.value, eleveNom: el ? `${el.prenom ?? ''} ${el.nom ?? ''}`.trim() : '' }));
                  }}
                  style={{ ...inp() }}
                >
                  <option value="">— Choisir un élève —</option>
                  {(rawEleves as Record<string, unknown>[]).map((el) => (
                    <option key={String(el.id)} value={String(el.id)}>
                      {`${el.prenom ?? ''} ${el.nom ?? ''}`.trim()}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.eleveNom} onChange={(e) => setForm((f) => ({ ...f, eleveNom: e.target.value }))} style={inp()} placeholder="Nom de l'élève" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inp() }}>
                  <option value="DISCIPLINAIRE">Disciplinaire</option>
                  <option value="ACADEMIQUE">Académique</option>
                  <option value="ADMINISTRATIF">Administratif</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Date de convocation *</label>
                <input type="date" value={form.dateConvocation} onChange={(e) => setForm((f) => ({ ...f, dateConvocation: e.target.value }))} style={inp()} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Motif *</label>
              <textarea value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} rows={3} style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Motif de la convocation…" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl()}>Observations</label>
              <textarea value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} rows={2} style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Observations complémentaires…" />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compte-rendu Modal */}
      {showCR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Compte-rendu de convocation</div>
            <textarea
              value={crText}
              onChange={(e) => setCrText(e.target.value)}
              rows={6}
              style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              placeholder="Rédigez le compte-rendu de la convocation…"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowCR(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSaveCR} disabled={savingCR} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingCR ? 0.7 : 1 }}>
                {savingCR ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
