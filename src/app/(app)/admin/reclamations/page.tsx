'use client';

import { useState, useMemo } from 'react';
import { useAdminReclamations, useRepondreReclamation } from '@/hooks/use-query-api';

/* ── Types ── */
type StatutRec = 'EN_ATTENTE' | 'TRAITEE' | 'REJETEE';

interface Eleve {
  id: string;
  firstName?: string;
  lastName?: string;
  matricule?: string;
  email?: string;
}

interface Reclamation {
  id: string;
  eleveId: string;
  noteId?: string | null;
  motif: string;
  statut: StatutRec;
  reponse?: string | null;
  pieceJointeUrl?: string | null;
  createdAt: string;
  eleve?: Eleve | null;
}

/* ── Config ── */
const STATUT_CFG: Record<StatutRec, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
  TRAITEE:    { label: 'Traitée',    bg: '#dcfce7', color: '#166534' },
  REJETEE:    { label: 'Rejetée',    bg: '#fee2e2', color: '#991b1b' },
};

function eleveName(r: Reclamation) {
  if (!r.eleve) return r.eleveId.slice(0, 8);
  return `${r.eleve.firstName ?? ''} ${r.eleve.lastName ?? ''}`.trim() || r.eleveId.slice(0, 8);
}
function initials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
}
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

/* ── Page ── */
export default function ReclamationsAdminPage() {
  const { data: raw, isLoading } = useAdminReclamations();
  const reclamations: Reclamation[] = useMemo(() => {
    const d = raw;
    const list = Array.isArray(d) ? d : ((d as { content?: Reclamation[] })?.content ?? []);
    return list as Reclamation[];
  }, [raw]);

  const repondre = useRepondreReclamation();

  const [onglet, setOnglet] = useState<'en_attente' | 'historique'>('en_attente');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Reclamation | null>(null);
  const [reponseText, setReponseText] = useState('');
  const [decision, setDecision] = useState<'TRAITEE' | 'REJETEE'>('TRAITEE');

  /* ── Dérivés ── */
  const enAttente   = reclamations.filter(r => r.statut === 'EN_ATTENTE');
  const historique  = reclamations.filter(r => r.statut !== 'EN_ATTENTE');

  const currentList = onglet === 'en_attente' ? enAttente : historique;
  const filtered = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(r =>
      eleveName(r).toLowerCase().includes(q) ||
      r.motif.toLowerCase().includes(q),
    );
  }, [currentList, search]);

  /* ── Actions ── */
  function openDetail(r: Reclamation) {
    setSelected(r);
    setReponseText(r.reponse ?? '');
    setDecision('TRAITEE');
  }

  function handleRepondre() {
    if (!selected) return;
    if (!reponseText.trim()) return;
    repondre.mutate({ id: selected.id, message: reponseText, statut: decision }, {
      onSuccess: () => setSelected(null),
    });
  }

  /* ── Styles helpers ── */
  const lbl = (): React.CSSProperties => ({ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4, display: 'block' });
  const val = (): React.CSSProperties => ({ fontSize: 13, color: '#334155' });

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f5f7fa' }}>

      {/* ── Panneau gauche ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: selected ? '1px solid #e6ebf1' : 'none' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Réclamations</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Supervision des réclamations élèves · notes · professeurs</div>
        </div>

        {/* KPIs */}
        <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12 }}>
          {[
            { label: 'Total',      value: reclamations.length,                      color: '#0f172a' },
            { label: 'En attente', value: enAttente.length,                          color: '#92400e' },
            { label: 'Traitées',   value: reclamations.filter(r => r.statut === 'TRAITEE').length,  color: '#166534' },
            { label: 'Rejetées',   value: reclamations.filter(r => r.statut === 'REJETEE').length,  color: '#991b1b' },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Onglets + filtres */}
        <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e6ebf1', marginTop: 14, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            {([
              ['en_attente', `En attente (${enAttente.length})`],
              ['historique',  `Historique (${historique.length})`],
            ] as [typeof onglet, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setOnglet(key); setSearch(''); }} style={{ height: 42, padding: '0 18px', border: 'none', background: 'none', fontSize: 13, fontWeight: onglet === key ? 700 : 400, color: onglet === key ? '#2563eb' : '#64748b', borderBottom: onglet === key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher élève, motif…"
            style={{ height: 32, padding: '0 10px', border: '1px solid #d9e0e8', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }}
          />
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
          {isLoading && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {onglet === 'en_attente' ? 'Aucune réclamation en attente' : 'Aucune réclamation dans l\'historique'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(r => {
              const st = STATUT_CFG[r.statut] ?? STATUT_CFG.EN_ATTENTE;
              const nom = eleveName(r);
              const isActive = selected?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => openDetail(r)}
                  style={{ background: '#fff', border: `1px solid ${isActive ? '#2563eb' : '#e6ebf1'}`, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, background: r.noteId ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: r.noteId ? '#2563eb' : '#166534', fontSize: 13, fontWeight: 700 }}>
                    {initials(nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{nom}</span>
                      {r.eleve?.matricule && <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.eleve.matricule}</span>}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: r.noteId ? '#eff6ff' : '#f1f5f9', color: r.noteId ? '#2563eb' : '#475569' }}>
                        {r.noteId ? 'Note' : 'Général'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motif}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{fmtDate(r.createdAt)}</div>
                  </div>
                  {r.statut === 'EN_ATTENTE' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — Détail ── */}
      {selected && (
        <div style={{ width: 420, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header détail */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Détail de la réclamation</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Statut badge */}
            <div>
              {(() => { const st = STATUT_CFG[selected.statut]; return (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: st.bg, color: st.color }}>{st.label}</span>
              ); })()}
            </div>

            {/* Élève */}
            <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                  {initials(eleveName(selected))}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{eleveName(selected)}</div>
                  {selected.eleve?.matricule && <div style={{ fontSize: 12, color: '#64748b' }}>{selected.eleve.matricule}</div>}
                  {selected.eleve?.email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{selected.eleve.email}</div>}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={lbl()}>Type</span>
                <span style={val()}>{selected.noteId ? 'Contestation de note' : 'Réclamation générale'}</span>
              </div>
              <div>
                <span style={lbl()}>Date</span>
                <span style={val()}>{fmtDate(selected.createdAt)}</span>
              </div>
            </div>

            {/* Motif */}
            <div>
              <span style={lbl()}>Motif / Description</span>
              <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px 14px', fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selected.motif}
              </div>
            </div>

            {/* Pièce jointe */}
            {selected.pieceJointeUrl && (
              <div>
                <span style={lbl()}>Pièce jointe</span>
                <a href={selected.pieceJointeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563eb' }}>Voir le document</a>
              </div>
            )}

            {/* Réponse existante */}
            {selected.reponse && (
              <div>
                <span style={lbl()}>Réponse précédente</span>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', fontSize: 13, color: '#166534', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selected.reponse}
                </div>
              </div>
            )}

            {/* Section réponse */}
            <div style={{ borderTop: '1px solid #e6ebf1', paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                {selected.statut === 'EN_ATTENTE' ? 'Répondre à cette réclamation' : 'Modifier la réponse'}
              </div>

              {/* Décision */}
              <div style={{ marginBottom: 12 }}>
                <span style={lbl()}>Décision</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setDecision('TRAITEE')} style={{ flex: 1, height: 36, border: `2px solid ${decision === 'TRAITEE' ? '#166534' : '#e2e8f0'}`, background: decision === 'TRAITEE' ? '#f0fdf4' : '#fff', color: decision === 'TRAITEE' ? '#166534' : '#64748b', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Traitée
                  </button>
                  <button onClick={() => setDecision('REJETEE')} style={{ flex: 1, height: 36, border: `2px solid ${decision === 'REJETEE' ? '#991b1b' : '#e2e8f0'}`, background: decision === 'REJETEE' ? '#fff1f2' : '#fff', color: decision === 'REJETEE' ? '#991b1b' : '#64748b', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Rejetée
                  </button>
                </div>
              </div>

              {/* Réponse */}
              <div style={{ marginBottom: 14 }}>
                <span style={lbl()}>Message de réponse *</span>
                <textarea
                  value={reponseText}
                  onChange={e => setReponseText(e.target.value)}
                  rows={4}
                  placeholder="Saisissez votre réponse à l'élève…"
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                onClick={handleRepondre}
                disabled={!reponseText.trim() || repondre.isPending}
                style={{ width: '100%', height: 40, border: 'none', background: decision === 'TRAITEE' ? '#166534' : '#991b1b', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: !reponseText.trim() ? 'not-allowed' : 'pointer', opacity: (!reponseText.trim() || repondre.isPending) ? 0.6 : 1 }}
              >
                {repondre.isPending ? 'Envoi…' : decision === 'TRAITEE' ? 'Marquer traitée & répondre' : 'Rejeter & répondre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
