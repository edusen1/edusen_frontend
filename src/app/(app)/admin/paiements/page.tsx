'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminPaiements, useAdminEleves, useCreateCaissePaiement, useUpdateCaissePaiement } from '@/hooks/use-query-api';

const STATIC_PAIEMENTS = [
  { id: 'p1', eleve: 'Awa Ndiaye', eleveId: 'e1', classe: '3ᵉ B', type: 'SCOLARITE', typLabel: 'Scolarité T2', montant: 45000, statut: 'PAYE', date: '12/01/2026', mode: 'MOBILE_MONEY' },
  { id: 'p2', eleve: 'Cheikh Sarr', eleveId: 'e2', classe: '4ᵉ A', type: 'SCOLARITE', typLabel: 'Scolarité T2', montant: 45000, statut: 'PAYE', date: '14/01/2026', mode: 'MOBILE_MONEY' },
  { id: 'p3', eleve: 'Fatou Bâ', eleveId: 'e3', classe: '3ᵉ B', type: 'SCOLARITE', typLabel: 'Scolarité T2', montant: 45000, statut: 'EN_ATTENTE', date: '—', mode: '—' },
  { id: 'p4', eleve: 'Ibrahima Fall', eleveId: 'e4', classe: '5ᵉ A', type: 'INSCRIPTION', typLabel: 'Inscription', montant: 25000, statut: 'PAYE', date: '02/09/2025', mode: 'ESPECES' },
  { id: 'p5', eleve: 'Mariama Diop', eleveId: 'e5', classe: '4ᵉ B', type: 'SCOLARITE', typLabel: 'Scolarité T2', montant: 45000, statut: 'REJETE', date: '—', mode: '—' },
  { id: 'p6', eleve: 'Moussa Diallo', eleveId: 'e6', classe: '3ᵉ B', type: 'SCOLARITE', typLabel: 'Scolarité T1', montant: 45000, statut: 'PAYE', date: '05/10/2025', mode: 'VIREMENT' },
  { id: 'p7', eleve: 'Aminata Cissé', eleveId: 'e7', classe: '5ᵉ B', type: 'CANTINE', typLabel: 'Cantine', montant: 18000, statut: 'EN_ATTENTE', date: '—', mode: '—' },
];

// Dérive la devise depuis le pays de l'établissement (synchronisé avec la configuration)
const PAYS_DEVISES: Record<string, string> = {
  SN: 'F CFA', ML: 'F CFA', GW: 'F CFA', CI: 'F CFA', BF: 'F CFA',
  NE: 'F CFA', TG: 'F CFA', BJ: 'F CFA',
  MR: 'MRU', GN: 'GNF', GM: 'GMD', SL: 'SLE', GH: 'GH₵', NG: '₦', CV: 'CVE', LR: 'LRD',
};
function getDevise(): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('medaaris_pays');
      if (saved && PAYS_DEVISES[saved]) return PAYS_DEVISES[saved];
    } catch { /* ignore */ }
  }
  return 'MRU'; // fallback
}

const STATUT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PAYE: { label: 'Payé', bg: '#dcfce7', color: '#16a34a' },
  payé: { label: 'Payé', bg: '#dcfce7', color: '#16a34a' },
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  en_attente: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  REJETE: { label: 'Rejeté', bg: '#fee2e2', color: '#dc2626' },
  retard: { label: 'En retard', bg: '#fee2e2', color: '#dc2626' },
};

const MODE_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  CARTE: 'Carte',
};

const TYPE_LABELS: Record<string, string> = {
  INSCRIPTION: 'Inscription',
  SCOLARITE: 'Scolarité',
  CANTINE: 'Cantine',
  TRANSPORT: 'Transport',
  AUTRE: 'Autre',
};

const EMPTY_ENC = {
  eleveId: '',
  eleveSearch: '',
  type: 'SCOLARITE',
  mode: 'ESPECES',
  montant: '',
  anneeScolaire: '2025-2026',
  trimestre: '1',
  transactionId: '',
  description: '',
};

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

function getEleveLabel(p: Record<string, unknown>): string {
  if (typeof p.eleve === 'string') return p.eleve;
  if (p.eleve && typeof p.eleve === 'object') {
    const e = p.eleve as Record<string, string>;
    return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
  }
  return '';
}

function getModeLabel(mode: unknown): string {
  return MODE_LABELS[String(mode ?? '')] ?? String(mode ?? '—');
}

function getTypeLabel(type: unknown, typLabel: unknown): string {
  if (typLabel) return String(typLabel);
  return TYPE_LABELS[String(type ?? '')] ?? String(type ?? '—');
}

export default function AdminPaiementsPage() {
  const { data } = useAdminPaiements();
  const { data: elevesData } = useAdminEleves();
  const rawList = Array.isArray(data) ? data : (data?.paiements ?? data?.data ?? []);
  const paiements = rawList.length > 0 ? rawList : STATIC_PAIEMENTS;
  const rawEleves = Array.isArray(elevesData) ? elevesData : (elevesData?.eleves ?? elevesData?.data ?? []);

  const createPaiement = useCreateCaissePaiement();
  const updatePaiement = useUpdateCaissePaiement();

  const [tab, setTab] = useState<'liste' | 'encaissement'>('liste');
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterType, setFilterType] = useState('');
  const [enc, setEnc] = useState(EMPTY_ENC);
  const [saving, setSaving] = useState(false);

  const filtered = (paiements as Record<string, unknown>[]).filter((p) => {
    const eleve = getEleveLabel(p).toLowerCase();
    const statut = String(p.statut ?? '');
    const type = String(p.type ?? '');
    const matchSearch = !search || eleve.includes(search.toLowerCase());
    const matchStatut = !filterStatut || statut === filterStatut;
    const matchType = !filterType || type === filterType;
    return matchSearch && matchStatut && matchType;
  });

  const montantTotal = filtered.reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const nbPayes = filtered.filter((p) => p.statut === 'PAYE' || p.statut === 'payé').length;
  const montantRecouvre = filtered.filter((p) => p.statut === 'PAYE' || p.statut === 'payé').reduce((s, p) => s + (Number(p.montant) || 0), 0);
  const nbEnAttente = filtered.filter((p) => p.statut === 'EN_ATTENTE' || p.statut === 'en_attente').length;

  const devise = getDevise();
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' ' + devise;

  const handleValider = async (id: string) => {
    try {
      await updatePaiement.mutateAsync({ id, data: { statut: 'PAYE' } });
    } catch { /* hook handles toast */ }
  };

  const handleRejeter = async (id: string) => {
    if (!confirm('Rejeter ce paiement ?')) return;
    try {
      await updatePaiement.mutateAsync({ id, data: { statut: 'REJETE' } });
    } catch { /* hook handles toast */ }
  };

  const handleEncaissement = async () => {
    if (!enc.montant || Number(enc.montant) <= 0) {
      toast.error('Le montant est requis');
      return;
    }
    if (!enc.eleveId && !enc.eleveSearch) {
      toast.error('Veuillez sélectionner un élève');
      return;
    }
    setSaving(true);
    try {
      await createPaiement.mutateAsync({
        eleveId: enc.eleveId || undefined,
        type: enc.type,
        modePaiement: enc.mode,
        montant: Number(enc.montant),
        anneeScolaire: enc.anneeScolaire,
        trimestre: enc.trimestre ? Number(enc.trimestre) : undefined,
        transactionId: enc.transactionId || undefined,
        description: enc.description || undefined,
      });
      setEnc(EMPTY_ENC);
      setTab('liste');
    } catch { /* hook handles toast */ }
    finally { setSaving(false); }
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '0 20px',
    height: 40,
    border: 'none',
    borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
    background: 'none',
    fontSize: 13,
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? '#2563eb' : '#64748b',
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Paiements</div>
        <div style={{ display: 'flex', gap: 0, marginLeft: 20 }}>
          <button style={tabStyle('liste')} onClick={() => setTab('liste')}>Liste des paiements</button>
          <button style={tabStyle('encaissement')} onClick={() => setTab('encaissement')}>+ Encaissement</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Total attendu', value: fmt(montantTotal), bg: '#eff6ff', color: '#2563eb' },
          { label: 'Recouvré', value: fmt(montantRecouvre), bg: '#dcfce7', color: '#16a34a' },
          { label: 'En attente', value: String(nbEnAttente), bg: '#fef3c7', color: '#d97706' },
          { label: 'Taux recouvrement', value: filtered.length > 0 ? `${Math.round((nbPayes / filtered.length) * 100)}%` : '0%', bg: '#f0fdf4', color: '#15803d' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {tab === 'liste' && (
        <>
          {/* Filters */}
          <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 320 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
            </div>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
              <option value="">Tous les statuts</option>
              <option value="PAYE">Payé</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="REJETE">Rejeté</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
              <option value="">Tous les types</option>
              <option value="INSCRIPTION">Inscription</option>
              <option value="SCOLARITE">Scolarité</option>
              <option value="CANTINE">Cantine</option>
              <option value="TRANSPORT">Transport</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 130px 120px 70px 110px 80px 130px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Élève', 'Classe', 'Type', 'Montant', 'Statut', 'Date', 'Mode', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun paiement trouvé</div>
              )}
              {filtered.map((p, idx) => {
                const statut = String(p.statut ?? 'EN_ATTENTE');
                const st = STATUT_LABELS[statut] ?? STATUT_LABELS.EN_ATTENTE;
                const isEnAttente = statut === 'EN_ATTENTE' || statut === 'en_attente';
                return (
                  <div key={String(p.id ?? idx)} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 130px 120px 70px 110px 80px 130px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{getEleveLabel(p)}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{String(p.classe ?? '')}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{getTypeLabel(p.type, p.typLabel)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(Number(p.montant) || 0)}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{String(p.date ?? '—')}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{getModeLabel(p.mode)}</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {isEnAttente && (
                        <>
                          <button onClick={() => handleValider(String(p.id))} style={{ height: 26, padding: '0 8px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Valider
                          </button>
                          <button onClick={() => handleRejeter(String(p.id))} style={{ height: 26, padding: '0 8px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === 'encaissement' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 28, maxWidth: 680 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Enregistrer un encaissement</div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl()}>Élève *</label>
              {rawEleves.length > 0 ? (
                <select
                  value={enc.eleveId}
                  onChange={(e) => setEnc((f) => ({ ...f, eleveId: e.target.value }))}
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
                <input value={enc.eleveSearch} onChange={(e) => setEnc((f) => ({ ...f, eleveSearch: e.target.value }))} style={inp()} placeholder="Nom ou matricule de l'élève" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl()}>Type de paiement *</label>
                <select value={enc.type} onChange={(e) => setEnc((f) => ({ ...f, type: e.target.value }))} style={{ ...inp() }}>
                  <option value="INSCRIPTION">Inscription</option>
                  <option value="SCOLARITE">Scolarité</option>
                  <option value="CANTINE">Cantine</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Mode de paiement *</label>
                <select value={enc.mode} onChange={(e) => setEnc((f) => ({ ...f, mode: e.target.value }))} style={{ ...inp() }}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="CARTE">Carte bancaire</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl()}>Montant ({devise}) *</label>
                <input type="number" value={enc.montant} onChange={(e) => setEnc((f) => ({ ...f, montant: e.target.value }))} style={inp()} placeholder="Ex: 45000" min="0" />
              </div>
              <div>
                <label style={lbl()}>Année scolaire</label>
                <input value={enc.anneeScolaire} onChange={(e) => setEnc((f) => ({ ...f, anneeScolaire: e.target.value }))} style={inp()} placeholder="2025-2026" />
              </div>
              <div>
                <label style={lbl()}>Trimestre</label>
                <select value={enc.trimestre} onChange={(e) => setEnc((f) => ({ ...f, trimestre: e.target.value }))} style={{ ...inp() }}>
                  <option value="">—</option>
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl()}>ID de transaction</label>
              <input value={enc.transactionId} onChange={(e) => setEnc((f) => ({ ...f, transactionId: e.target.value }))} style={inp()} placeholder="Référence de la transaction (optionnel)" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl()}>Description</label>
              <textarea value={enc.description} onChange={(e) => setEnc((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Informations complémentaires…" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setEnc(EMPTY_ENC); setTab('liste'); }} style={{ height: 40, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleEncaissement} disabled={saving} style={{ height: 40, padding: '0 28px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
