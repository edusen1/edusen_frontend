'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

type Demande = {
  id: string;
  eleveId: string;
  inscriptionId?: string | null;
  pourcentage: number;
  motif: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  commentaireAdmin?: string | null;
  createdAt: string;
  eleve?: { id: string; firstName: string; lastName: string; matricule?: string };
  demandeParUser?: { id: string; firstName: string; lastName: string; email?: string | null; role: string };
  traiteParUser?: { id: string; firstName: string; lastName: string } | null;
  inscription?: { id: string; numeroInscription: string; classe?: { nom: string } } | null;
};

const STATUT_MAP = {
  EN_ATTENTE: { label: 'En attente',  bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  APPROUVEE:  { label: 'Approuvée',   bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  REJETEE:    { label: 'Rejetée',     bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function initials(d: Demande) {
  return ((d.eleve?.firstName?.[0] ?? '') + (d.eleve?.lastName?.[0] ?? '')).toUpperCase();
}
function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  return `Il y a ${days} j`;
}

export default function ReductionsPage() {
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'ADMIN';

  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('');

  // Modal approuver
  const [approuverTarget, setApprouverTarget] = useState<Demande | null>(null);
  const [commentaireApprobation, setCommentaireApprobation] = useState('');
  const [approuverSaving, setApprouverSaving] = useState(false);

  // Modal rejeter
  const [rejeterTarget, setRejeterTarget] = useState<Demande | null>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [rejeterSaving, setRejeterSaving] = useState(false);

  const fetchDemandes = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { mine: isAdmin ? 'false' : 'true' };
    if (filterStatut) params['statut'] = filterStatut;
    apiClient.get('/admin/reductions/demandes', { params })
      .then((r) => {
        const d = r.data as Record<string, unknown>;
        setDemandes((Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])) as Demande[]);
      })
      .catch(() => toast.error('Erreur chargement des demandes'))
      .finally(() => setLoading(false));
  }, [filterStatut, isAdmin]);

  useEffect(() => { fetchDemandes(); }, [fetchDemandes]);

  const handleApprouver = async () => {
    if (!approuverTarget) return;
    setApprouverSaving(true);
    try {
      await apiClient.patch(`/admin/reductions/demandes/${approuverTarget.id}/approuver`, { commentaire: commentaireApprobation.trim() || undefined });
      toast.success(`Réduction ${approuverTarget.pourcentage}% approuvée pour ${approuverTarget.eleve?.firstName} ${approuverTarget.eleve?.lastName}`);
      setApprouverTarget(null);
      setCommentaireApprobation('');
      fetchDemandes();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    } finally { setApprouverSaving(false); }
  };

  const handleRejeter = async () => {
    if (!rejeterTarget) return;
    if (!motifRejet.trim()) { toast.error('Le motif de rejet est obligatoire'); return; }
    setRejeterSaving(true);
    try {
      await apiClient.patch(`/admin/reductions/demandes/${rejeterTarget.id}/rejeter`, { commentaire: motifRejet.trim() });
      toast.success('Demande rejetée');
      setRejeterTarget(null);
      setMotifRejet('');
      fetchDemandes();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    } finally { setRejeterSaving(false); }
  };

  const enAttente = demandes.filter(d => d.statut === 'EN_ATTENTE').length;
  const approuvees = demandes.filter(d => d.statut === 'APPROUVEE').length;
  const rejetees  = demandes.filter(d => d.statut === 'REJETEE').length;

  const inp = (error?: boolean): React.CSSProperties => ({
    width: '100%', border: `1px solid ${error ? '#f87171' : '#d9e0e8'}`,
    padding: '0 12px', height: 38, fontSize: 13, color: '#0f172a',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: error ? '#fff5f5' : '#fff',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            Réductions &amp; coupons
            {enAttente > 0 && isAdmin && <span style={{ marginLeft: 10, fontSize: 12, background: '#fef3c7', color: '#d97706', fontWeight: 700, padding: '2px 8px' }}>{enAttente} en attente</span>}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
            {isAdmin ? 'Demandes et réductions appliquées' : 'Vos demandes de réduction soumises'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'En attente', count: enAttente, color: '#d97706', bg: '#fef3c7' },
          { label: 'Approuvées', count: approuvees, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Rejetées',   count: rejetees,   color: '#dc2626', bg: '#fee2e2' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, maxWidth: 200, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => setFilterStatut(s.label === 'En attente' ? 'EN_ATTENTE' : s.label === 'Approuvées' ? 'APPROUVEE' : 'REJETEE')}>
            <div style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.count}</span>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtre statut */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 8 }}>
        {[['', 'Toutes'], ['EN_ATTENTE', 'En attente'], ['APPROUVEE', 'Approuvées'], ['REJETEE', 'Rejetées']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatut(val)}
            style={{ height: 34, padding: '0 14px', border: `1px solid ${filterStatut === val ? '#2563eb' : '#e2e8f0'}`, background: filterStatut === val ? '#2563eb' : '#fff', color: filterStatut === val ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* En-tête table */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 100px 1.5fr 120px 180px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
            {['Élève', isAdmin ? 'Origine' : 'Classe', 'Réduction', 'Motif', 'Statut', isAdmin ? 'Actions' : 'Réponse admin'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement...</div>
            ) : demandes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                {filterStatut === 'EN_ATTENTE' ? 'Aucune demande en attente' : 'Aucune demande'}
              </div>
            ) : demandes.map((d, idx) => {
              const st = STATUT_MAP[d.statut];
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 100px 1.5fr 120px 180px', alignItems: 'center', padding: '12px 18px', borderBottom: idx < demandes.length - 1 ? '1px solid #eef2f6' : 'none', gap: 8 }}>
                  {/* Élève */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(d)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.eleve?.firstName} {d.eleve?.lastName}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {d.eleve?.matricule && <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.eleve.matricule}</span>}
                        {d.inscription?.classe?.nom && <span style={{ fontSize: 11, color: '#2563eb', background: '#eff6ff', padding: '1px 6px' }}>{d.inscription.classe.nom}</span>}
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>{relativeDate(d.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Demandeur ou classe */}
                  {isAdmin ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{d.demandeParUser?.firstName} {d.demandeParUser?.lastName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.demandeParUser?.email ?? d.demandeParUser?.role}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#64748b' }}>{d.inscription?.classe?.nom ?? '—'}</span>
                  )}

                  {/* Pourcentage */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{d.pourcentage}<span style={{ fontSize: 12 }}>%</span></span>
                  </div>

                  {/* Motif */}
                  <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                    {d.motif}
                  </div>

                  {/* Statut */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 9px', display: 'inline-block' }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: st.dot, marginRight: 5, verticalAlign: 'middle' }} />
                      {st.label}
                    </span>
                  </div>

                  {/* Actions / réponse */}
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {d.statut === 'EN_ATTENTE' && (
                        <>
                          <button onClick={() => { setApprouverTarget(d); setCommentaireApprobation(''); }}
                            style={{ height: 28, padding: '0 10px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Approuver
                          </button>
                          <button onClick={() => { setRejeterTarget(d); setMotifRejet(''); }}
                            style={{ height: 28, padding: '0 10px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                            Rejeter
                          </button>
                        </>
                      )}
                      {d.statut !== 'EN_ATTENTE' && d.commentaireAdmin && (
                        <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{d.commentaireAdmin}</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: d.statut === 'APPROUVEE' ? '#16a34a' : d.statut === 'REJETEE' ? '#dc2626' : '#94a3b8', fontStyle: d.commentaireAdmin ? 'italic' : 'normal' }}>
                      {d.commentaireAdmin ?? (d.statut === 'EN_ATTENTE' ? 'En cours de traitement…' : '—')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ flexShrink: 0, padding: '10px 18px', borderTop: '1px solid #eef2f6' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{demandes.length} demande(s)</span>
          </div>
        </div>
      </div>

      {/* ─── Modal Approuver ─── */}
      {approuverTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 460, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Approuver la réduction</div>
              <button onClick={() => setApprouverTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {/* Récap demande */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{approuverTarget.eleve?.firstName} {approuverTarget.eleve?.lastName}</div>
                    {approuverTarget.inscription?.classe?.nom && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>{approuverTarget.inscription.classe.nom}</div>}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>{approuverTarget.pourcentage}%</div>
                </div>
                <div style={{ fontSize: 12, color: '#475569', borderTop: '1px solid #bbf7d0', paddingTop: 8 }}>
                  <strong>Motif :</strong> {approuverTarget.motif}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Demandé par {approuverTarget.demandeParUser?.email ?? `${approuverTarget.demandeParUser?.firstName ?? ''} ${approuverTarget.demandeParUser?.lastName ?? ''}`.trim()}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5 }}>
                  Commentaire <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span>
                </label>
                <textarea
                  value={commentaireApprobation}
                  onChange={(e) => setCommentaireApprobation(e.target.value)}
                  placeholder="Ex : Bourse accordée selon le dossier social de l'élève"
                  rows={3}
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setApprouverTarget(null)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleApprouver} disabled={approuverSaving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: approuverSaving ? 0.7 : 1 }}>
                {approuverSaving ? 'En cours...' : 'Confirmer l\'approbation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Rejeter ─── */}
      {rejeterTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 460, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Rejeter la demande</div>
              <button onClick={() => setRejeterTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{rejeterTarget.eleve?.firstName} {rejeterTarget.eleve?.lastName} — {rejeterTarget.pourcentage}%</div>
                <div style={{ fontSize: 12, color: '#475569' }}><strong>Motif initial :</strong> {rejeterTarget.motif}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5 }}>
                  Motif de rejet <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  value={motifRejet}
                  onChange={(e) => setMotifRejet(e.target.value)}
                  placeholder="Ex : Dossier incomplet, critères non remplis..."
                  rows={3}
                  style={{ ...inp(!motifRejet.trim() && rejeterSaving ? true : false), height: 'auto', padding: '8px 12px', resize: 'vertical' } as React.CSSProperties}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setRejeterTarget(null)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleRejeter} disabled={rejeterSaving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: rejeterSaving ? 0.7 : 1 }}>
                {rejeterSaving ? 'En cours...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
