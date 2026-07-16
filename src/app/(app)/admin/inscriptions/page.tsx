'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';

// ─── Types ────────────────────────────────────────────────────────────────────

type InscItem = {
  id: string; eleveId: string; classeId: string; anneeAcademiqueId: string;
  statut: string; fraisInscription?: number | null; numeroInscription?: string; cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null;
  classe?: { id: string; nom: string };
  anneeAcademique?: { id: string; libelle: string };
  eleve?: { id: string; firstName: string; lastName: string; matricule?: string; photoUrl?: string };
  // enriched on frontend
  _totalPaye?: number;
  _paymentId?: string | null;
  _reduction?: { pourcentage: number; statut: string } | null;
};
type EleveResult = { id: string; firstName: string; lastName: string; matricule?: string; photoUrl?: string | null };
type ClasseItem  = { id: string; nom: string; effectifMax?: number; effectifActuel?: number; nbEleves?: number; placesRestantes?: number; niveau?: { nom: string; cycle?: { nom: string } } };
type FraisConfig = { section: string; niveau: string; inscription: number; mensualite: number; nbMois: number };
type AnneeItem   = { id: string; libelle: string };
type Suggestion  = {
  lastInscription: null | { statut?: string; classe: { nom: string }; niveau: { libelle: string; moyennePassage?: number }; anneeAcademique?: { libelle: string } };
  moyenne: number | null; peutPasser: boolean;
  nextNiveau?: null | { id: string; libelle: string };
  classesDisponibles: ClasseItem[];
  frais: null | { inscription: number; mensualite: number; nbMois: number };
  impayesCount: number;
};
type FormErrors = {
  eleve?: string; classe?: string; reductionPct?: string; motifReduction?: string; montantRecu?: string;
};
type Paiement = {
  id: string; eleveId: string; inscriptionId?: string | null; montant: number; typePaiement: string; modePaiement: string;
  statut: string; anneeScolaire: string; trimestre?: string | null; description?: string | null;
  reference?: string; transactionId?: string | null; datePaiement?: string | null; createdAt: string; updatedAt?: string;
  eleve?: { id: string; firstName: string; lastName: string; matricule?: string; classeId?: string; photoUrl?: string | null };
  _montantDu?: number;
  _totalPayeMois?: number;
  _dette?: number;
};
type PaiPreviewInscription = {
  id: string;
  classeId: string;
  anneeAcademiqueId: string;
  anneeAcademique?: { id: string; libelle: string };
};
type DemandeReduction = {
  id: string; eleveId: string; inscriptionId?: string | null;
  pourcentage: number; motif: string; statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  commentaireAdmin?: string | null; createdAt: string;
  eleve?: { id: string; firstName: string; lastName: string; matricule?: string; photoUrl?: string | null };
  demandeParUser?: { id: string; firstName: string; lastName: string; email?: string | null; role: string };
  traiteParUser?: { id: string; firstName: string; lastName: string } | null;
  inscription?: { id: string; numeroInscription: string; classe?: { nom: string } } | null;
};
type DemandePassage = {
  id: string; eleveId: string; classeDestId: string; motif?: string | null; motifRefus?: string | null;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE'; createdAt: string;
  eleve?: { id: string; firstName: string; lastName: string; matricule?: string };
  classeDest?: { id: string; nom: string; niveau?: { libelle?: string; nom?: string } | null };
  anneeAcademique?: { id: string; libelle: string };
};
type DebtPaymentTarget = { inscription: InscItem; montant: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_INSC: Record<string, { label: string; bg: string; color: string }> = {
  ACTIF:     { label: 'Actif',     bg: '#dcfce7', color: '#16a34a' },
  TRANSFERE: { label: 'Transféré', bg: '#dbeafe', color: '#2563eb' },
  EXCLU:     { label: 'Exclu',     bg: '#fee2e2', color: '#dc2626' },
  INACTIF:   { label: 'Inactif',   bg: '#f1f5f9', color: '#64748b' },
  TERMINE:   { label: 'Terminé',   bg: '#f1f5f9', color: '#64748b' },
};
const STATUT_PAI: Record<string, { label: string; bg: string; color: string }> = {
  VALIDE:     { label: 'Payé',       bg: '#dcfce7', color: '#16a34a' },
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  REJETE:     { label: 'Rejeté',     bg: '#fee2e2', color: '#dc2626' },
};
const STATUT_RED: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  APPROUVEE:  { label: 'Approuvée',  bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  REJETEE:    { label: 'Rejetée',    bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};
const MODE_OPTIONS = [
  { value: 'ESPECES',      label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE',         label: 'Wave' },
  { value: 'CHEQUE',       label: 'Chèque' },
  { value: 'VIREMENT',     label: 'Virement bancaire' },
];
const MODE_LABELS: Record<string, string> = {
  ESPECES: 'Espèces', MOBILE_MONEY: 'Mobile Money', VIREMENT: 'Virement', CHEQUE: 'Chèque', CARTE: 'Carte',
};
const MONTH_OPTIONS = [
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPrismaMode(m: string) { return (m === 'ORANGE_MONEY' || m === 'WAVE') ? 'MOBILE_MONEY' : m; }
function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function relDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'Auj.' : d === 1 ? 'Hier' : `${d}j`;
}
function monthLabelFromKey(key?: string | null) {
  const month = Number(String(key ?? '').replace('MOIS_', ''));
  return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? key ?? '—';
}
function openReceiptUrls(payload: unknown) {
  const data = payload as { receiptPdfUrl?: string | null; content?: Array<{ receiptPdfUrl?: string | null }> };
  const urls = [...(data.receiptPdfUrl ? [data.receiptPdfUrl] : []), ...((data.content ?? []).map((item) => item.receiptPdfUrl).filter(Boolean) as string[])];
  urls.slice(0, 3).forEach((url) => window.open(url, '_blank', 'noopener,noreferrer'));
  if (urls.length > 3) toast.info(`${urls.length} reçus PDF générés. Les 3 premiers ont été ouverts.`);
}
function openPreparedUrl(target: Window | null, url: string) {
  if (target && !target.closed) {
    target.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
function openSchoolCardUrl(payload: unknown) {
  const wrapped = payload as { data?: { cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null }; cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null };
  const data = wrapped.data ?? wrapped;
  const url = data?.cardUrl ?? data?.cardImageUrl ?? data?.cardPdfUrl;
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
async function printPaymentReceipt(paymentId?: string | null) {
  if (!paymentId) { toast.error('Aucun reçu à imprimer'); return; }
  const target = window.open('', '_blank');
  const res = await apiClient.get(`/admin/paiements/${paymentId}/recu`);
  const data = res.data as { receiptPdfUrl?: string | null };
  if (data.receiptPdfUrl) openPreparedUrl(target, data.receiptPdfUrl);
  else {
    target?.close();
    openReceiptUrls(res.data);
  }
}
async function printSchoolCard(inscriptionId?: string | null) {
  if (!inscriptionId) { toast.error('Inscription introuvable'); return; }
  const target = window.open('', '_blank');
  const res = await apiClient.post(`/admin/inscriptions/${inscriptionId}/carte-scolaire`);
  const wrapped = res.data as { data?: { cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null }; cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null };
  const data = wrapped.data ?? wrapped;
  const url = data.cardUrl ?? data.cardImageUrl ?? data.cardPdfUrl;
  if (url) openPreparedUrl(target, url);
  else {
    target?.close();
    toast.error('Carte scolaire introuvable');
  }
}
function inp(error?: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return { height: 38, width: '100%', border: `1px solid ${error ? '#f87171' : '#d9e0e8'}`, padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: error ? '#fff5f5' : '#fff', ...extra };
}
function lbl(color?: string): React.CSSProperties { return { display: 'block', fontSize: 12, fontWeight: 500, color: color ?? '#334155', marginBottom: 5 }; }
function errTxt(msg?: string) {
  if (!msg) return null;
  return <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{msg}</div>;
}
type Tab = 'inscriptions' | 'mensualites' | 'reductions' | 'passages';
const DEFAULT_PAGE_SIZE = 10;

function pageItems<T>(items: T[], page: number) {
  return items.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);
}
function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
}
function PaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = pageCount(total);
  const start = total === 0 ? 0 : (page - 1) * DEFAULT_PAGE_SIZE + 1;
  const end = Math.min(total, page * DEFAULT_PAGE_SIZE);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{start}-{end} sur {total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Préc.</button>
        <span style={{ fontSize: 12, color: '#64748b' }}>{page}/{totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Suiv.</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScolaritePage() {
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('inscriptions');
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ left: number; top: number; width: number } | null>(null);

  // ── Shared state ──
  const [anneeCourante, setAnneeCourante] = useState<AnneeItem | null>(null);
  const [allClasses, setAllClasses] = useState<ClasseItem[]>([]);
  const [fraisConfigs, setFraisConfigs] = useState<FraisConfig[]>([]);

  useEffect(() => {
    apiClient.get('/admin/configuration/annees-academiques/courante')
      .then((r) => setAnneeCourante((r.data?.data ?? r.data) as AnneeItem)).catch(() => {});
    apiClient.get('/admin/classes')
      .then((r) => { const d = r.data as Record<string,unknown>; setAllClasses((Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as ClasseItem[]); }).catch(() => {});
    apiClient.get('/admin/configuration/frais')
      .then((r) => { const d = r.data as Record<string,unknown>; setFraisConfigs((Array.isArray(d) ? d : (d?.data ?? [])) as FraisConfig[]); }).catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => { setOpenActionMenu(null); setActionMenuPos(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggleActionMenu = (key: string, event: React.MouseEvent<HTMLButtonElement>, width = 150) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation?.();
    if (openActionMenu === key) {
      setOpenActionMenu(null);
      setActionMenuPos(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = key.startsWith('insc-') ? 170 : key.startsWith('pai-') ? 78 : 44;
    const below = rect.bottom + 4;
    const top = below + estimatedHeight > window.innerHeight
      ? Math.max(8, rect.top - estimatedHeight - 4)
      : below;
    setActionMenuPos({
      width,
      left: Math.max(8, rect.right - width),
      top,
    });
    setOpenActionMenu(key);
  };

  const actionMenuStyle = (width = 150): React.CSSProperties => ({
    position: 'fixed',
    left: actionMenuPos?.left ?? 0,
    top: actionMenuPos?.top ?? 0,
    width: actionMenuPos?.width ?? width,
    maxWidth: actionMenuPos?.width ?? width,
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 30px rgba(15,23,42,.16)',
    zIndex: 5000,
    padding: 4,
    textAlign: 'left',
  });

  // ── Inscriptions state ──
  const [inscriptions, setInscriptions] = useState<InscItem[]>([]);
  const [inscTotal, setInscTotal] = useState(0);
  const [inscLoading, setInscLoading] = useState(true);
  const [inscSearch, setInscSearch] = useState('');
  const [inscFilterStatut, setInscFilterStatut] = useState('');
  const [inscPage, setInscPage] = useState(1);
  const [inscModalOpen, setInscModalOpen] = useState(false);
  const [inscSaving, setInscSaving] = useState(false);
  const [inscAttempted, setInscAttempted] = useState(false);
  const [inscErrors, setInscErrors] = useState<FormErrors>({});
  const [eleveSearch, setEleveSearch] = useState('');
  const [eleveResults, setEleveResults] = useState<EleveResult[]>([]);
  const [eleveLoading, setEleveLoading] = useState(false);
  const [eleveDropOpen, setEleveDropOpen] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState<EleveResult | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const eleveRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inscriptionPrefillAppliedRef = useRef(false);
  const [classeId, setClasseId] = useState('');
  const [fraisBase, setFraisBase] = useState<number | null>(null);
  const [hasReduction, setHasReduction] = useState(false);
  const [reductionPct, setReductionPct] = useState('');
  const [motifReduction, setMotifReduction] = useState('');
  const [hasPaiement, setHasPaiement] = useState(false);
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [montantRecu, setMontantRecu] = useState('');
  const [refTransaction, setRefTransaction] = useState('');
  const [transferTarget, setTransferTarget] = useState<InscItem | null>(null);
  const [newClasseId, setNewClasseId] = useState('');
  const [transferSaving, setTransferSaving] = useState(false);
  const [debtTarget, setDebtTarget] = useState<DebtPaymentTarget | null>(null);
  const [debtSaving, setDebtSaving] = useState(false);
  const [debtMode, setDebtMode] = useState('ESPECES');
  const [mensuDebtTarget, setMensuDebtTarget] = useState<Paiement | null>(null);
  const [mensuDebtMode, setMensuDebtMode] = useState('ESPECES');
  const [mensuDebtSaving, setMensuDebtSaving] = useState(false);

  // ── Mensualités state ──
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [paiLoading, setPaiLoading] = useState(false);
  const [paiFilter, setPaiFilter] = useState('');
  const [paiSearch, setPaiSearch] = useState('');
  const [paiClasseId, setPaiClasseId] = useState('');
  const [paiPage, setPaiPage] = useState(1);
  const [paiModalOpen, setPaiModalOpen] = useState(false);
  const [paiSaving, setPaiSaving] = useState(false);
  const [paiEleveSearch, setPaiEleveSearch] = useState('');
  const [paiEleveResults, setPaiEleveResults] = useState<EleveResult[]>([]);
  const [paiEleveDropOpen, setPaiEleveDropOpen] = useState(false);
  const [paiSelectedEleve, setPaiSelectedEleve] = useState<EleveResult | null>(null);
  const [paiSelectedInscription, setPaiSelectedInscription] = useState<PaiPreviewInscription | null>(null);
  const [paiMonthlyAmount, setPaiMonthlyAmount] = useState<number | null>(null);
  const [paiReductionPct, setPaiReductionPct] = useState(0);
  const [paiSelectedMonths, setPaiSelectedMonths] = useState<number[]>([]);
  const [paiPaidMonths, setPaiPaidMonths] = useState<Set<number>>(new Set());
  const [paiMode, setPaiMode] = useState('ESPECES');
  const [paiRef, setPaiRef] = useState('');
  const [paiAmountReceived, setPaiAmountReceived] = useState('');
  const paiEleveRef = useRef<HTMLDivElement>(null);
  const paiDebRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Réductions state ──
  const [demandes, setDemandes] = useState<DemandeReduction[]>([]);
  const [redLoading, setRedLoading] = useState(false);
  const [redFilter, setRedFilter] = useState('');
  const [redPage, setRedPage] = useState(1);
  const [approuverTarget, setApprouverTarget] = useState<DemandeReduction | null>(null);
  const [commentaireApp, setCommentaireApp] = useState('');
  const [appSaving, setAppSaving] = useState(false);
  const [rejeterTarget, setRejeterTarget] = useState<DemandeReduction | null>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [rejSaving, setRejSaving] = useState(false);
  const [passages, setPassages] = useState<DemandePassage[]>([]);
  const [passageLoading, setPassageLoading] = useState(false);
  const [passageFilter, setPassageFilter] = useState('');
  const [passagePage, setPassagePage] = useState(1);
  const [motifPassage, setMotifPassage] = useState('');

  // ──────────────────────────────────────────────────────────────────────────
  // Inscriptions logic
  // ──────────────────────────────────────────────────────────────────────────

  const fraisNet = fraisBase != null
    ? Math.round(fraisBase * (1 - Math.min(100, Math.max(0, Number(reductionPct || '0'))) / 100))
    : null;

  const validateInsc = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!selectedEleve) e.eleve = 'Sélectionnez un élève';
    if (!classeId) e.classe = 'Sélectionnez une classe';
    if (hasReduction) {
      const pct = Number(reductionPct);
      if (!reductionPct || isNaN(pct) || pct < 1 || pct > 100) e.reductionPct = 'Pourcentage entre 1 et 100';
      if (!isAdmin && !motifReduction.trim()) e.motifReduction = 'Le motif est obligatoire';
    }
    if (hasPaiement) {
      const m = Number(montantRecu);
      if (!montantRecu || isNaN(m) || m <= 0) e.montantRecu = 'Saisissez un montant valide';
      const ref = isAdmin ? fraisNet : fraisBase;
      if (ref != null && m > ref) e.montantRecu = `Ne peut pas dépasser ${fmt(ref)} F`;
    }
    return e;
  }, [selectedEleve, classeId, hasReduction, reductionPct, motifReduction, isAdmin, hasPaiement, montantRecu, fraisNet, fraisBase]);

  useEffect(() => { if (inscAttempted) setInscErrors(validateInsc()); }, [inscAttempted, validateInsc]);

  const fetchInscriptions = useCallback(() => {
    setInscLoading(true);
    const params: Record<string,string> = { size: '200' };
    if (inscFilterStatut && inscFilterStatut !== 'REDUCTION_EN_ATTENTE') params['statut'] = inscFilterStatut;
    if (inscSearch)       params['search'] = inscSearch;
    Promise.all([
      apiClient.get('/admin/inscriptions', { params }),
      apiClient.get('/admin/paiements', { params: { typePaiement: 'INSCRIPTION', size: '500' } }),
      apiClient.get('/admin/reductions/demandes'),
    ]).then(([rInsc, rPai, rRed]) => {
      const dInsc = rInsc.data as Record<string,unknown>;
      const list = (Array.isArray(dInsc) ? dInsc : (dInsc?.content ?? dInsc?.data ?? [])) as InscItem[];
      setInscTotal(Number(dInsc?.totalElements ?? dInsc?.total ?? list.length));

      // Build paiements map: eleveId → total payé (INSCRIPTION type)
      const paiList = (Array.isArray(rPai.data) ? rPai.data : ((rPai.data as Record<string,unknown>)?.content ?? (rPai.data as Record<string,unknown>)?.data ?? [])) as Array<{ id: string; eleveId: string; montant: number; statut: string; inscriptionId?: string }>;
      const paiByInscId = new Map<string, number>();
      const paiByEleveId = new Map<string, number>();
      const paymentIdByInscId = new Map<string, string>();
      const paymentIdByEleveId = new Map<string, string>();
      for (const p of paiList) {
        if (p.statut !== 'VALIDE') continue;
        if (p.inscriptionId) paiByInscId.set(p.inscriptionId, (paiByInscId.get(p.inscriptionId) ?? 0) + p.montant);
        if (p.eleveId) paiByEleveId.set(p.eleveId, (paiByEleveId.get(p.eleveId) ?? 0) + p.montant);
        if (p.inscriptionId && !paymentIdByInscId.has(p.inscriptionId)) paymentIdByInscId.set(p.inscriptionId, p.id);
        if (p.eleveId && !paymentIdByEleveId.has(p.eleveId)) paymentIdByEleveId.set(p.eleveId, p.id);
      }

      // Build reductions map: inscriptionId or eleveId → last reduction
      const redList = (Array.isArray(rRed.data) ? rRed.data : ((rRed.data as Record<string,unknown>)?.data ?? [])) as DemandeReduction[];
      const redByInscId = new Map<string, DemandeReduction>();
      const redByEleveId = new Map<string, DemandeReduction>();
      for (const r of redList) {
        if (r.inscriptionId) redByInscId.set(r.inscriptionId, r);
        redByEleveId.set(r.eleveId, r);
      }

      const enriched = list.map(ins => ({
        ...ins,
        _totalPaye: paiByInscId.get(ins.id) ?? paiByEleveId.get(ins.eleveId) ?? 0,
        _paymentId: paymentIdByInscId.get(ins.id) ?? paymentIdByEleveId.get(ins.eleveId) ?? null,
        _reduction: (redByInscId.get(ins.id) ?? redByEleveId.get(ins.eleveId)) ? {
          pourcentage: (redByInscId.get(ins.id) ?? redByEleveId.get(ins.eleveId))!.pourcentage,
          statut: (redByInscId.get(ins.id) ?? redByEleveId.get(ins.eleveId))!.statut,
        } : null,
      }));
      const filtered = inscFilterStatut === 'REDUCTION_EN_ATTENTE'
        ? enriched.filter((ins) => ins._reduction?.statut === 'EN_ATTENTE')
        : enriched;
      setInscriptions(filtered);
    })
      .catch(() => toast.error('Erreur chargement inscriptions'))
      .finally(() => setInscLoading(false));
  }, [inscFilterStatut, inscSearch]);

  useEffect(() => { if (activeTab === 'inscriptions') fetchInscriptions(); }, [activeTab, fetchInscriptions]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!eleveSearch.trim() || selectedEleve) { setEleveResults([]); setEleveDropOpen(false); return; }
    debounceRef.current = setTimeout(() => {
      setEleveLoading(true);
      apiClient.get('/admin/eleves', { params: { search: eleveSearch, statut: 'actif' } })
        .then((r) => { const d = r.data as Record<string,unknown>; setEleveResults((Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as EleveResult[]); setEleveDropOpen(true); })
        .catch(() => {}).finally(() => setEleveLoading(false));
    }, 300);
  }, [eleveSearch, selectedEleve]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (eleveRef.current && !eleveRef.current.contains(e.target as Node)) setEleveDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const clearEleve = () => {
    setSelectedEleve(null); setEleveSearch(''); setSuggestion(null);
    setClasseId(''); setFraisBase(null);
    setHasReduction(false); setReductionPct(''); setMotifReduction('');
    setHasPaiement(false); setMontantRecu(''); setRefTransaction('');
  };

  const selectEleve = (e: EleveResult) => {
    setSelectedEleve(e); setEleveSearch(`${e.firstName} ${e.lastName}`); setEleveDropOpen(false);
    setSuggestion(null); setClasseId(''); setFraisBase(null);
    setHasReduction(false); setReductionPct(''); setMotifReduction('');
    setHasPaiement(false); setMontantRecu(''); setRefTransaction('');
    setSuggestionLoading(true);
    apiClient.get(`/v1/inscriptions/suggestion/${e.id}`)
      .then((r) => {
        const s = (r.data?.data ?? r.data) as Suggestion;
        setSuggestion(s);
        if (s.classesDisponibles?.length === 1) setClasseId(s.classesDisponibles[0].id);
        if (s.frais?.inscription != null) setFraisBase(s.frais.inscription);
      })
      .catch(() => {}).finally(() => setSuggestionLoading(false));
  };

  const openInscModal = () => {
    clearEleve(); setInscAttempted(false); setInscErrors({});
    setInscModalOpen(true);
  };

  useEffect(() => {
    if (inscriptionPrefillAppliedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const eleveId = params.get('inscrire') ?? params.get('eleveId');
    if (!eleveId) return;

    inscriptionPrefillAppliedRef.current = true;
    const eleve: EleveResult = {
      id: eleveId,
      firstName: params.get('prenom') ?? params.get('firstName') ?? '',
      lastName: params.get('nom') ?? params.get('lastName') ?? '',
      matricule: params.get('matricule') ?? undefined,
    };
    setActiveTab('inscriptions');
    clearEleve();
    setInscAttempted(false);
    setInscErrors({});
    setInscModalOpen(true);
    selectEleve(eleve);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleInscSave = async () => {
    setInscAttempted(true);
    const errs = validateInsc();
    setInscErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!anneeCourante) { toast.error('Aucune année académique active'); return; }
    setInscSaving(true);
    try {
      const fraisEnvoyes = isAdmin ? fraisNet : fraisBase;
      const res = await apiClient.post('/admin/inscriptions', {
        eleveId: selectedEleve!.id, classeId, anneeAcademiqueId: anneeCourante.id,
        fraisInscription: fraisEnvoyes,
      });
      const insc = (res.data?.data ?? res.data) as Record<string,unknown>;
      const inscriptionId = String(insc?.id ?? '');
      if (hasReduction && reductionPct) {
        const motif = isAdmin
          ? 'Réduction appliquée directement par l’administration lors de l’inscription'
          : motifReduction.trim();
        await apiClient.post('/admin/reductions/demandes', { eleveId: selectedEleve!.id, inscriptionId, pourcentage: Number(reductionPct), motif });
        if (!isAdmin) toast.info(`Demande de réduction ${reductionPct}% envoyée — en attente de validation`);
      }
      if (hasPaiement && montantRecu) {
        const modeLabel = MODE_OPTIONS.find(m => m.value === modePaiement)?.label ?? modePaiement;
        const descParts = [`Frais inscription — ${modeLabel}`];
        if (hasReduction && isAdmin) descParts.push(`(réduction ${reductionPct}%)`);
        const paiementRes = await apiClient.post('/admin/paiements', {
          eleveId: selectedEleve!.id, inscriptionId, montant: Number(montantRecu),
          typePaiement: 'INSCRIPTION', modePaiement: toPrismaMode(modePaiement),
          anneeScolaire: anneeCourante.libelle, description: descParts.join(' · '),
          transactionId: refTransaction.trim() || undefined, statut: 'VALIDE',
        });
        openReceiptUrls(paiementRes.data);
      }
      const ref = isAdmin ? fraisNet : fraisBase;
      const reste = ref != null && montantRecu ? Math.max(0, ref - Number(montantRecu)) : 0;
      toast.success(`${selectedEleve!.firstName} ${selectedEleve!.lastName} inscrit(e)${reste > 0 ? ` — reste ${fmt(reste)} F` : ''}`);
      setInscModalOpen(false); fetchInscriptions();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (!isAdmin && message.includes('DEMANDE_PASSAGE_REQUISE') && selectedEleve && classeId) {
        try {
          await apiClient.post('/v1/demandes-passage', {
            eleveId: selectedEleve.id,
            classeDestId: classeId,
            motif: motifPassage.trim() || 'Demande de passage malgré moyenne insuffisante',
          });
          toast.info('Demande de passage envoyée à l’administration');
          setInscModalOpen(false);
          setActiveTab('passages');
          return;
        } catch (passageErr: unknown) {
          toast.error((passageErr as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur lors de la demande de passage');
          return;
        }
      }
      if (message.includes('ELEVE_EXCLU')) {
        toast.error(isAdmin ? 'Cet élève est exclu pour cette année scolaire. Vous pouvez réactiver son inscription exclue si vous confirmez la levée.' : 'Cet élève est exclu pour cette année scolaire. Faites une demande à l’administration.');
        return;
      }
      toast.error(message || "Erreur lors de l'inscription");
    } finally { setInscSaving(false); }
  };

  const handleTransfer = async () => {
    if (!newClasseId || !transferTarget) return;
    setTransferSaving(true);
    try { await apiClient.patch(`/v1/inscriptions/${transferTarget.id}/transferer`, { classeId: newClasseId }); toast.success('Transfert effectué'); setTransferTarget(null); fetchInscriptions(); }
    catch { toast.error('Erreur lors du transfert'); } finally { setTransferSaving(false); }
  };

  const handleDesactiver = async (ins: InscItem) => {
    const nom = `${ins.eleve?.firstName ?? ''} ${ins.eleve?.lastName ?? ''}`.trim();
    if (!confirm(`Désactiver l'inscription de ${nom} ?`)) return;
    try { await apiClient.patch(`/v1/inscriptions/${ins.id}/desactiver`); toast.success('Désactivée'); fetchInscriptions(); } catch { toast.error('Erreur'); }
  };
  const handleExclure = async (ins: InscItem) => {
    const nom = `${ins.eleve?.firstName ?? ''} ${ins.eleve?.lastName ?? ''}`.trim();
    const nbAnneesRaw = prompt(`Exclure ${nom} pour combien d'années scolaires ?`, '1');
    if (!nbAnneesRaw) return;
    const nbAnnees = Math.max(1, Math.min(10, Number(nbAnneesRaw) || 1));
    if (!confirm(`Confirmer l'exclusion de ${nom} pour ${nbAnnees} année(s) scolaire(s) configurée(s) ?`)) return;
    try { await apiClient.patch(`/v1/inscriptions/${ins.id}/exclure`, { nbAnnees }); toast.success('Élève exclu'); fetchInscriptions(); } catch { toast.error('Erreur'); }
  };
  const handleReactiver = async (ins: InscItem) => {
    try { await apiClient.patch(`/v1/inscriptions/${ins.id}/reactiver`); toast.success('Réactivée'); fetchInscriptions(); } catch { toast.error('Erreur'); }
  };

  const handlePayDebt = async () => {
    if (!debtTarget) return;
    const ins = debtTarget.inscription;
    const montantDette = debtTarget.montant;
    const target = window.open('', '_blank');
    setDebtSaving(true);
    try {
      const paiementRes = await apiClient.post('/admin/paiements', {
        eleveId: ins.eleveId,
        inscriptionId: ins.id,
        montant: montantDette,
        typePaiement: 'INSCRIPTION',
        modePaiement: debtMode,
        anneeScolaire: ins.anneeAcademique?.libelle ?? anneeCourante?.libelle ?? '',
        description: 'Remboursement dette inscription',
        statut: 'VALIDE',
      });
      const data = paiementRes.data as { receiptPdfUrl?: string | null };
      if (data.receiptPdfUrl) openPreparedUrl(target, data.receiptPdfUrl);
      else {
        target?.close();
        openReceiptUrls(paiementRes.data);
      }
      toast.success('Dette payée');
      setDebtTarget(null);
      fetchInscriptions();
    } catch {
      target?.close();
      toast.error('Erreur lors du paiement de la dette');
    } finally {
      setDebtSaving(false);
    }
  };

  // Recalcule fraisBase à chaque changement de classe
  useEffect(() => {
    if (!classeId) { setFraisBase(null); return; }
    const allKnown = [...(suggestion?.classesDisponibles ?? []), ...allClasses];
    const classe = allKnown.find(c => c.id === classeId);
    if (classe?.niveau?.nom) {
      const section = classe.niveau.cycle?.nom ?? '';
      const niv = classe.niveau.nom;
      const config = fraisConfigs.find(f => f.section === section && f.niveau === niv);
      if (config != null) { setFraisBase(config.inscription > 0 ? config.inscription : null); return; }
    }
    // Fallback : frais déjà positionné par la suggestion
  }, [classeId, allClasses, suggestion, fraisConfigs]);

  const classesSuggestion = suggestion?.classesDisponibles?.length ? suggestion.classesDisponibles : allClasses;
  const inscActifs     = inscriptions.filter(i => i.statut === 'ACTIF').length;
  const inscTransferes = inscriptions.filter(i => i.statut === 'TRANSFERE').length;
  const inscAutres     = inscriptions.filter(i => i.statut !== 'ACTIF' && i.statut !== 'TRANSFERE').length;

  // ──────────────────────────────────────────────────────────────────────────
  // Mensualités logic
  // ──────────────────────────────────────────────────────────────────────────

  const fetchPaiements = useCallback(() => {
    setPaiLoading(true);
    const params: Record<string,string> = { typePaiement: 'SCOLARITE', size: '100' };
    if (paiFilter) params['statut'] = paiFilter;
    if (paiClasseId) params['classeId'] = paiClasseId;
    if (paiSearch) params['search'] = paiSearch;
    apiClient.get('/admin/paiements', { params })
      .then((r) => {
        const d = r.data as Record<string,unknown>;
        const raw = (Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as Paiement[];
        // Consolider par eleve+mois : garder la ligne la plus recente, utiliser _totalPayeMois du backend
        const grouped = new Map<string, Paiement>();
        for (const p of raw) {
          const key = `${p.eleveId}_${p.trimestre}_${p.anneeScolaire}`;
          const existing = grouped.get(key);
          if (!existing || new Date(p.updatedAt ?? p.createdAt ?? '').getTime() > new Date(existing.updatedAt ?? existing.createdAt ?? '').getTime()) {
            grouped.set(key, {
              ...p,
              // Utiliser le total et la dette calcules par le backend (deja corrects)
              montant: Number(p._totalPayeMois ?? p.montant ?? 0),
              _dette: Number(p._dette ?? 0),
            });
          }
        }
        setPaiements([...grouped.values()]);
      })
      .catch(() => toast.error('Erreur chargement mensualités'))
      .finally(() => setPaiLoading(false));
  }, [paiFilter, paiClasseId, paiSearch]);

  useEffect(() => { if (activeTab === 'mensualites') fetchPaiements(); }, [activeTab, fetchPaiements]);

  useEffect(() => {
    if (paiDebRef.current) clearTimeout(paiDebRef.current);
    if (!paiEleveSearch.trim() || paiSelectedEleve) { setPaiEleveResults([]); setPaiEleveDropOpen(false); return; }
    paiDebRef.current = setTimeout(() => {
      apiClient.get('/admin/eleves', { params: { search: paiEleveSearch, statut: 'actif' } })
        .then((r) => { const d = r.data as Record<string,unknown>; setPaiEleveResults((Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as EleveResult[]); setPaiEleveDropOpen(true); })
        .catch(() => {});
    }, 300);
  }, [paiEleveSearch, paiSelectedEleve]);

  useEffect(() => {
    if (!paiSelectedEleve || !anneeCourante) {
      setPaiSelectedInscription(null);
      setPaiMonthlyAmount(null);
      setPaiReductionPct(0);
      setPaiPaidMonths(new Set());
      return;
    }
    let cancelled = false;
    Promise.all([
      apiClient.get('/admin/inscriptions', { params: { eleveId: paiSelectedEleve.id, statut: 'ACTIF', size: '1' } }),
      apiClient.get('/admin/reductions/demandes', { params: { statut: 'APPROUVEE', eleveId: paiSelectedEleve.id } }).catch(() => ({ data: [] })),
      apiClient.get('/admin/paiements', { params: { eleveId: paiSelectedEleve.id, typePaiement: 'SCOLARITE', statut: 'VALIDE', size: '200' } }).catch(() => ({ data: { content: [] } })),
    ]).then(([inscRes, redRes, paymentsRes]) => {
      if (cancelled) return;
      const inscData = inscRes.data as Record<string, unknown>;
      const activeInsc = ((inscData.content ?? inscData.data ?? []) as PaiPreviewInscription[])[0] ?? null;
      setPaiSelectedInscription(activeInsc);
      const classe = allClasses.find((c) => c.id === activeInsc?.classeId);
      const section = classe?.niveau?.cycle?.nom ?? '';
      const niveau = classe?.niveau?.nom ?? '';
      const frais = fraisConfigs.find((f) => f.section === section && f.niveau === niveau);
      const redData = redRes.data as Record<string, unknown> | DemandeReduction[];
      const reductions = (Array.isArray(redData) ? redData : ((redData.data ?? redData.content ?? []) as DemandeReduction[]));
      const approved = reductions.find((r) => !r.inscriptionId || r.inscriptionId === activeInsc?.id);
      const pct = Math.max(0, Math.min(100, Number(approved?.pourcentage ?? 0)));
      setPaiReductionPct(pct);
      const monthlyAmount = frais ? Math.round(Number(frais.mensualite) * (1 - pct / 100)) : null;
      setPaiMonthlyAmount(monthlyAmount);
      const paymentsData = paymentsRes.data as Record<string, unknown> | Paiement[];
      const payments = (Array.isArray(paymentsData) ? paymentsData : ((paymentsData.content ?? paymentsData.data ?? []) as Paiement[]));
      const paidByMonth = new Map<number, number>();
      for (const payment of payments) {
        if (activeInsc?.id && (payment as Paiement & { inscriptionId?: string | null }).inscriptionId && (payment as Paiement & { inscriptionId?: string | null }).inscriptionId !== activeInsc.id) continue;
        const month = Number(String(payment.trimestre ?? '').replace('MOIS_', ''));
        if (!Number.isFinite(month) || month < 1 || month > 12) continue;
        paidByMonth.set(month, (paidByMonth.get(month) ?? 0) + Number(payment.montant ?? 0));
      }
      const paidMonths = new Set<number>();
      if (monthlyAmount != null) {
        for (const [month, total] of paidByMonth) {
          if (total >= monthlyAmount) paidMonths.add(month);
        }
      }
      setPaiPaidMonths(paidMonths);
      setPaiSelectedMonths((months) => months.filter((month) => !paidMonths.has(month)));
    }).catch(() => {
      if (!cancelled) {
        setPaiSelectedInscription(null);
        setPaiMonthlyAmount(null);
        setPaiReductionPct(0);
        setPaiPaidMonths(new Set());
      }
    });
    return () => { cancelled = true; };
  }, [paiSelectedEleve, anneeCourante, allClasses, fraisConfigs]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (paiEleveRef.current && !paiEleveRef.current.contains(e.target as Node)) setPaiEleveDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handlePaiSave = async () => {
    if (!paiSelectedEleve) { toast.error('Sélectionnez un élève'); return; }
    if (!paiSelectedMonths.length) { toast.error('Sélectionnez au moins un mois'); return; }
    if (!paiMonthlyAmount || paiMonthlyAmount <= 0) { toast.error('Mensualité non configurée pour ce niveau'); return; }
    if (!anneeCourante) { toast.error('Aucune année académique active'); return; }
    const montantRecu = Math.round(Number(paiAmountReceived || paiTotalSelection));
    if (!Number.isFinite(montantRecu) || montantRecu <= 0) { toast.error('Saisissez un montant reçu valide'); return; }
    if (montantRecu > paiTotalSelection) { toast.error(`Le montant reçu ne peut pas dépasser ${fmt(paiTotalSelection)} F`); return; }
    setPaiSaving(true);
    try {
      const res = await apiClient.post('/admin/paiements/mensualites', {
        eleveId: paiSelectedEleve.id,
        mois: paiSelectedMonths,
        modePaiement: toPrismaMode(paiMode),
        anneeScolaire: anneeCourante.libelle,
        transactionId: paiRef.trim() || undefined,
        montantRecu,
        statut: 'VALIDE',
      });
      const data = res.data as { count?: number; total?: number };
      openReceiptUrls(res.data);
      toast.success(`${data.count ?? paiSelectedMonths.length} mensualité(s) payée(s) — ${fmt(Number(data.total ?? paiMonthlyAmount * paiSelectedMonths.length))} F`);
      setPaiModalOpen(false);
      setPaiSelectedEleve(null); setPaiSelectedInscription(null); setPaiEleveSearch(''); setPaiSelectedMonths([]); setPaiMonthlyAmount(null); setPaiReductionPct(0); setPaiPaidMonths(new Set()); setPaiMode('ESPECES'); setPaiRef(''); setPaiAmountReceived('');
      fetchPaiements();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    } finally { setPaiSaving(false); }
  };

  const handlePaiCompleteDebt = (payment: Paiement) => {
    const dette = Math.round(Number(payment._dette ?? 0));
    if (dette <= 0) { toast.error('Pas de dette'); return; }
    setMensuDebtTarget(payment);
    setMensuDebtMode('ESPECES');
  };

  const handleConfirmMensuDebt = async () => {
    if (!mensuDebtTarget) return;
    const payment = mensuDebtTarget;
    const dette = Math.round(Number(payment._dette ?? 0));
    const month = Number(String(payment.trimestre ?? '').replace('MOIS_', ''));
    if (!Number.isFinite(month) || month < 1) { toast.error('Mois invalide'); return; }
    setMensuDebtSaving(true);
    try {
      // Utilise le meme endpoint mensualites — le backend detecte le paiement existant
      // et cree un complement avec le montant restant uniquement
      await apiClient.post('/admin/paiements/mensualites', {
        eleveId: payment.eleveId,
        mois: [month],
        modePaiement: mensuDebtMode,
        anneeScolaire: payment.anneeScolaire,
        montantRecu: dette,
        statut: 'VALIDE',
      });
      toast.success('Dette mensualité complétée');
      setMensuDebtTarget(null);
      fetchPaiements();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    } finally {
      setMensuDebtSaving(false);
    }
  };

  const paiValides = paiements.filter(p => p.statut === 'VALIDE').length;
  const paiAttente = paiements.filter(p => p.statut === 'EN_ATTENTE').length;
  const paiTotal   = paiements.reduce((s, p) => p.statut === 'VALIDE' ? s + p.montant : s, 0);
  const paiTotalSelection = (paiMonthlyAmount ?? 0) * paiSelectedMonths.length;

  // ──────────────────────────────────────────────────────────────────────────
  // Réductions logic
  // ──────────────────────────────────────────────────────────────────────────

  const fetchDemandes = useCallback(() => {
    setRedLoading(true);
    const params: Record<string,string> = { mine: isAdmin ? 'false' : 'true' };
    if (redFilter) params['statut'] = redFilter;
    apiClient.get('/admin/reductions/demandes', { params })
      .then((r) => { const d = r.data as Record<string,unknown>; setDemandes((Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])) as DemandeReduction[]); })
      .catch(() => toast.error('Erreur chargement des demandes'))
      .finally(() => setRedLoading(false));
  }, [redFilter, isAdmin]);

  useEffect(() => { if (activeTab === 'reductions') fetchDemandes(); }, [activeTab, fetchDemandes]);

  const handleApprouver = async () => {
    if (!approuverTarget) return;
    setAppSaving(true);
    try {
      await apiClient.patch(`/admin/reductions/demandes/${approuverTarget.id}/approuver`, { commentaire: commentaireApp.trim() || undefined });
      toast.success(`Réduction ${approuverTarget.pourcentage}% approuvée`);
      setApprouverTarget(null); setCommentaireApp(''); fetchDemandes();
    } catch { toast.error('Erreur'); } finally { setAppSaving(false); }
  };

  const handleRejeter = async () => {
    if (!rejeterTarget || !motifRejet.trim()) { toast.error('Le motif est obligatoire'); return; }
    setRejSaving(true);
    try {
      await apiClient.patch(`/admin/reductions/demandes/${rejeterTarget.id}/rejeter`, { commentaire: motifRejet.trim() });
      toast.success('Demande rejetée');
      setRejeterTarget(null); setMotifRejet(''); fetchDemandes();
    } catch { toast.error('Erreur'); } finally { setRejSaving(false); }
  };

  const redEnAttente = demandes.filter(d => d.statut === 'EN_ATTENTE').length;

  // ──────────────────────────────────────────────────────────────────────────
  // Demandes de passage logic
  // ──────────────────────────────────────────────────────────────────────────

  const fetchPassages = useCallback(() => {
    setPassageLoading(true);
    const params: Record<string,string> = {};
    if (passageFilter) params['statut'] = passageFilter;
    apiClient.get('/v1/demandes-passage', { params })
      .then((r) => { const d = r.data as Record<string,unknown>; setPassages((Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])) as DemandePassage[]); })
      .catch(() => toast.error('Erreur chargement des passages'))
      .finally(() => setPassageLoading(false));
  }, [passageFilter]);

  useEffect(() => { if (activeTab === 'passages') fetchPassages(); }, [activeTab, fetchPassages]);

  const handleApprouverPassage = async (id: string) => {
    try {
      await apiClient.patch(`/v1/demandes-passage/${id}/approuver`, {});
      toast.success('Passage approuvé');
      fetchPassages();
      fetchInscriptions();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
  };

  const handleRejeterPassage = async (id: string) => {
    const motifRefus = prompt('Motif du rejet ?');
    if (!motifRefus?.trim()) return;
    try {
      await apiClient.patch(`/v1/demandes-passage/${id}/rejeter`, { motifRefus: motifRefus.trim() });
      toast.success('Passage rejeté');
      fetchPassages();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
  };

  const passagesEnAttente = passages.filter(p => p.statut === 'EN_ATTENTE').length;

  useEffect(() => { setInscPage(1); }, [inscSearch, inscFilterStatut]);
  useEffect(() => { setPaiPage(1); }, [paiSearch, paiFilter, paiClasseId]);
  useEffect(() => { setRedPage(1); }, [redFilter]);
  useEffect(() => { setPassagePage(1); }, [passageFilter]);
  useEffect(() => { setInscPage((page) => Math.min(page, pageCount(inscriptions.length))); }, [inscriptions.length]);
  useEffect(() => { setPaiPage((page) => Math.min(page, pageCount(paiements.length))); }, [paiements.length]);
  useEffect(() => { setRedPage((page) => Math.min(page, pageCount(demandes.length))); }, [demandes.length]);
  useEffect(() => { setPassagePage((page) => Math.min(page, pageCount(passages.length))); }, [passages.length]);

  const pagedInscriptions = pageItems(inscriptions, inscPage);
  const pagedPaiements = pageItems(paiements, paiPage);
  const pagedDemandes = pageItems(demandes, redPage);
  const pagedPassages = pageItems(passages, passagePage);

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  const TAB_ITEMS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'inscriptions', label: 'Inscriptions', badge: inscTotal > 0 ? inscTotal : undefined },
    { id: 'mensualites', label: 'Mensualités' },
    { id: 'reductions', label: 'Réductions', badge: isAdmin && redEnAttente > 0 ? redEnAttente : undefined },
    { id: 'passages', label: 'Passages', badge: isAdmin && passagesEnAttente > 0 ? passagesEnAttente : undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* ── Page header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Scolarité</div>
          {anneeCourante && <span style={{ fontSize: 12, color: '#2563eb', background: '#eff6ff', padding: '3px 10px', fontWeight: 600 }}>{anneeCourante.libelle}</span>}
          {/* Actions contextuelle */}
          {activeTab === 'inscriptions' && (
            <button onClick={openInscModal} style={{ marginLeft: 'auto', height: 38, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Inscrire un élève
            </button>
          )}
          {activeTab === 'mensualites' && (
            <button onClick={() => setPaiModalOpen(true)} style={{ marginLeft: 'auto', height: 38, padding: '0 16px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Enregistrer un paiement
            </button>
          )}
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #f1f5f9' }}>
          {TAB_ITEMS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ height: 40, padding: '0 18px', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#2563eb' : 'transparent'}`, background: 'transparent', color: activeTab === tab.id ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'color .15s' }}>
              {tab.label}
              {tab.badge != null && <span style={{ background: activeTab === tab.id ? '#2563eb' : '#94a3b8', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
           TAB: INSCRIPTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inscriptions' && (
        <>
          {/* Stats */}
          <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12 }}>
            {[{ label: 'Total', count: inscTotal, color: '#2563eb', bg: '#eff6ff' }, { label: 'Actifs', count: inscActifs, color: '#16a34a', bg: '#dcfce7' }, { label: 'Transférés', count: inscTransferes, color: '#7c3aed', bg: '#f5f3ff' }, { label: 'Autres', count: inscAutres, color: '#94a3b8', bg: '#f1f5f9' }].map(s => (
              <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.count}</span></div>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
              </div>
            ))}
          </div>
          {/* Filters */}
          <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', padding: '0 12px', background: '#fff', maxWidth: 340 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={inscSearch} onChange={e => setInscSearch(e.target.value)} placeholder="Nom, matricule..." style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', width: '100%', height: 38, fontFamily: 'inherit' }} />
            </div>
            <select value={inscFilterStatut} onChange={e => setInscFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
              <option value="">Tous statuts</option>
              <option value="ACTIF">Actifs</option>
              <option value="REDUCTION_EN_ATTENTE">Réduction en attente</option>
              <option value="INACTIF">Inactifs</option>
              <option value="TRANSFERE">Transférés</option>
              <option value="EXCLU">Exclus</option>
              <option value="TERMINE">Terminés</option>
            </select>
          </div>
          {/* Table */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '12px 28px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.4fr 120px 100px 150px', gap: 14, padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0, alignItems: 'center', textAlign: 'left' }}>
                {['Élève', 'Classe', 'Frais & Solde', 'Réduction', 'Statut', 'Actions'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {inscLoading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement...</div>
                  : inscriptions.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucune inscription</div>
                  : pagedInscriptions.map((ins, idx) => {
                    const pr = ins.eleve?.firstName ?? ''; const nm = ins.eleve?.lastName ?? '';
                    const ini = ((pr[0] ?? '') + (nm[0] ?? '')).toUpperCase();
                    const photo = ins.eleve?.photoUrl;
                    const st = STATUT_INSC[ins.statut] ?? { label: ins.statut, bg: '#f1f5f9', color: '#64748b' };
                    const frais = ins.fraisInscription != null ? Number(ins.fraisInscription) : null;
                    const paye = ins._totalPaye ?? 0;
                    const reste = frais != null ? Math.max(0, frais - paye) : null;
                    const red = ins._reduction;
                    return (
                      <div key={ins.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.4fr 120px 100px 150px', gap: 14, alignItems: 'center', textAlign: 'left', padding: '10px 18px', borderBottom: idx < pagedInscriptions.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                        {/* Élève */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0' }}>
                            {photo
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={photo} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{ini}</span>}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pr} {nm}</div>
                            {ins.eleve?.matricule && <div style={{ fontSize: 11, color: '#94a3b8' }}>{ins.eleve.matricule}</div>}
                          </div>
                        </div>
                        {/* Classe */}
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', display: 'inline-block' }}>{ins.classe?.nom ?? '—'}</span>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{ins.anneeAcademique?.libelle ?? ''}</div>
                        </div>
                        {/* Frais & Solde */}
                        <div style={{ fontSize: 12 }}>
                          {frais != null ? (
                            <>
                              <div style={{ color: '#475569' }}>Frais : <strong style={{ color: '#0f172a' }}>{fmt(frais)} F</strong></div>
                              <div style={{ color: '#16a34a' }}>Payé : <strong>{fmt(paye)} F</strong></div>
                              {reste != null && reste > 0
                                ? <div style={{ color: '#dc2626', fontWeight: 700 }}>Dette : {fmt(reste)} F ⚠</div>
                                : reste === 0 && paye > 0
                                  ? <div style={{ color: '#16a34a', fontWeight: 600 }}>Soldé ✓</div>
                                  : null}
                            </>
                          ) : <span style={{ color: '#94a3b8' }}>—</span>}
                        </div>
                        {/* Réduction */}
                        <div>
                          {red ? (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: red.statut === 'APPROUVEE' ? '#f0fdf4' : red.statut === 'REJETEE' ? '#fff5f5' : '#fef3c7',
                              color: red.statut === 'APPROUVEE' ? '#16a34a' : red.statut === 'REJETEE' ? '#dc2626' : '#d97706',
                              border: `1px solid ${red.statut === 'APPROUVEE' ? '#bbf7d0' : red.statut === 'REJETEE' ? '#fca5a5' : '#fde68a'}`,
                            }}>
                              <span>−{red.pourcentage}%</span>
                              <span style={{ fontSize: 9, opacity: 0.8 }}>{red.statut === 'APPROUVEE' ? '✓' : red.statut === 'REJETEE' ? '✗' : '⏳'}</span>
                            </span>
                          ) : <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>}
                        </div>
                        {/* Statut */}
                        <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                        {/* Actions */}
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                          <button onMouseDown={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); }} onClick={(event) => toggleActionMenu(`insc-${ins.id}`, event, 124)} style={{ height: 28, minWidth: 34, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', fontSize: 16, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}>⋯</button>
                          {openActionMenu === `insc-${ins.id}` && (
                            <div style={actionMenuStyle(124)} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                              <button onClick={() => { setOpenActionMenu(null); setTransferTarget(ins); setNewClasseId(''); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#334155', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Transférer</button>
                              {!['ACTIF', 'EXCLU', 'INACTIF'].includes(ins.statut) && (
                                <button onClick={() => { setOpenActionMenu(null); handleReactiver(ins); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#16a34a', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Réactiver</button>
                              )}
                              <button onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); setOpenActionMenu(null); printSchoolCard(ins.id); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#7c3aed', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Imprimer carte</button>
                              {ins._paymentId && <button onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); setOpenActionMenu(null); printPaymentReceipt(ins._paymentId); }} style={{ width: '100%', height: 30, border: 'none', background: '#eff6ff', color: '#2563eb', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Imprimer reçu</button>}
                              {reste != null && reste > 0 && <button onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); setOpenActionMenu(null); setDebtTarget({ inscription: ins, montant: reste }); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff7ed', color: '#c2410c', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Payer dette</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ flexShrink: 0, padding: '10px 18px', borderTop: '1px solid #eef2f6' }}>
                <PaginationControls page={inscPage} total={inscriptions.length} onPageChange={setInscPage} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB: MENSUALITÉS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mensualites' && (
        <>
          {/* Stats */}
          <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12 }}>
            {[
              { label: 'Payés', count: paiValides, color: '#16a34a', bg: '#dcfce7' },
              { label: 'En attente', count: paiAttente, color: '#d97706', bg: '#fef3c7' },
              { label: 'Total encaissé', count: null, amount: paiTotal, color: '#2563eb', bg: '#eff6ff' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: s.amount != null ? 11 : 16, fontWeight: 800, color: s.color }}>{s.amount != null ? `${fmt(s.amount)} F` : s.count}</span>
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
              </div>
            ))}
          </div>
          {/* Filters */}
          <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', padding: '0 12px', background: '#fff', maxWidth: 300 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={paiSearch} onChange={e => setPaiSearch(e.target.value)} placeholder="Réf, description..." style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', width: '100%', height: 38, fontFamily: 'inherit' }} />
            </div>
            <select value={paiFilter} onChange={e => setPaiFilter(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">Tous statuts</option>
              <option value="VALIDE">Payés</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
            <select value={paiClasseId} onChange={e => setPaiClasseId(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">Toutes classes</option>
              {allClasses.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          {/* Table */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '12px 28px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 120px 100px 90px', gap: 14, padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0, alignItems: 'center', textAlign: 'left' }}>
                {['Élève', 'Mois', 'Mode', 'Montant', 'Date', 'Statut', 'Reçu'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {paiLoading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement...</div>
                  : paiements.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucun paiement de mensualité</div>
                  : pagedPaiements.map((p, idx) => {
                    const pr = p.eleve?.firstName ?? ''; const nm = p.eleve?.lastName ?? '';
                    const ini = ((pr[0] ?? '') + (nm[0] ?? '')).toUpperCase();
                    const photo = p.eleve?.photoUrl;
                    const st = STATUT_PAI[p.statut] ?? { label: p.statut, bg: '#f1f5f9', color: '#64748b' };
                    const dateStr = p.datePaiement ? new Date(p.datePaiement).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : relDate(p.createdAt);
                    const dette = Math.round(Number(p._dette ?? 0));
                    const totalPayeMois = Math.round(Number(p._totalPayeMois ?? p.montant));
                    const montantDu = Math.round(Number(p._montantDu ?? p.montant));
                    return (
                      <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px 120px 100px 90px', gap: 14, alignItems: 'center', textAlign: 'left', padding: '10px 18px', borderBottom: idx < pagedPaiements.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, border: '2px solid #e2e8f0' }}>
                            {photo
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={photo} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : ini}
                          </div>
                          <div><div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pr} {nm}</div>{p.eleve?.matricule && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.eleve.matricule}</div>}</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{p.trimestre?.startsWith('MOIS_') ? monthLabelFromKey(p.trimestre) : p.trimestre ? `T${p.trimestre}` : p.anneeScolaire}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{MODE_LABELS[p.modePaiement] ?? p.modePaiement}</span>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ color: '#16a34a' }}>Payé : <strong>{fmt(totalPayeMois)} F</strong></div>
                          {montantDu > totalPayeMois && <div style={{ color: '#64748b' }}>Du : <strong>{fmt(montantDu)} F</strong></div>}
                          {dette > 0 && <div style={{ color: '#dc2626', fontWeight: 700 }}>Dette : {fmt(dette)} F ⚠</div>}
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{dateStr}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                          <button onMouseDown={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); }} onClick={(event) => toggleActionMenu(`pai-${p.id}`, event, 124)} style={{ height: 28, minWidth: 34, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', fontSize: 16, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}>⋯</button>
                          {openActionMenu === `pai-${p.id}` && (
                            <div style={actionMenuStyle(124)} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                              {p.statut === 'VALIDE' ? (
                                <>
                                  <button onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); setOpenActionMenu(null); printPaymentReceipt(p.id); }} style={{ width: '100%', height: 30, border: 'none', background: '#eff6ff', color: '#2563eb', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Imprimer reçu</button>
                                  {dette > 0 && <button onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); event.nativeEvent.stopImmediatePropagation?.(); setOpenActionMenu(null); handlePaiCompleteDebt(p); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff7ed', color: '#c2410c', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Compléter dette</button>}
                                </>
                              ) : <div style={{ padding: '8px 10px', fontSize: 12, color: '#94a3b8' }}>Aucune action</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ flexShrink: 0, padding: '10px 18px', borderTop: '1px solid #eef2f6' }}>
                <PaginationControls page={paiPage} total={paiements.length} onPageChange={setPaiPage} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           TAB: RÉDUCTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reductions' && (
        <>
          <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginRight: 8 }}>
              {isAdmin ? 'Demandes et réductions appliquées' : 'Vos demandes de réduction'}
            </div>
            {[['', 'Toutes'], ['EN_ATTENTE', 'En attente'], ['APPROUVEE', 'Approuvées'], ['REJETEE', 'Rejetées']].map(([val, label]) => (
              <button key={val} onClick={() => setRedFilter(val)}
                style={{ height: 32, padding: '0 12px', border: `1px solid ${redFilter === val ? '#2563eb' : '#e2e8f0'}`, background: redFilter === val ? '#2563eb' : '#fff', color: redFilter === val ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', padding: '12px 28px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 1.5fr 110px 1fr', gap: 14, padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0, alignItems: 'center', textAlign: 'left' }}>
                {['Élève', isAdmin ? 'Origine' : 'Classe', '%', 'Motif', 'Statut', isAdmin ? 'Actions' : 'Réponse'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {redLoading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement...</div>
                  : demandes.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucune demande{redFilter === 'EN_ATTENTE' ? ' en attente' : ''}</div>
                  : pagedDemandes.map((d, idx) => {
                    const st = STATUT_RED[d.statut];
                    const ini = ((d.eleve?.firstName?.[0] ?? '') + (d.eleve?.lastName?.[0] ?? '')).toUpperCase();
                    const photo = d.eleve?.photoUrl;
                    return (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 80px 1.5fr 110px 1fr', alignItems: 'center', textAlign: 'left', padding: '11px 18px', borderBottom: idx < pagedDemandes.length - 1 ? '1px solid #eef2f6' : 'none', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, border: '2px solid #e2e8f0' }}>
                            {photo
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={photo} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : ini}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.eleve?.firstName} {d.eleve?.lastName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6 }}>
                              {d.eleve?.matricule && <span>{d.eleve.matricule}</span>}
                              <span>{relDate(d.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {isAdmin ? (
                          <div><div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{d.demandeParUser?.firstName} {d.demandeParUser?.lastName}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{d.demandeParUser?.email ?? d.demandeParUser?.role}</div></div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>{d.inscription?.classe?.nom ?? '—'}</span>
                        )}
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>{d.pourcentage}<span style={{ fontSize: 11 }}>%</span></span>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{d.motif}</div>
                        <span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, flexShrink: 0, display: 'inline-block' }} />{st.label}
                          </span>
                        </span>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            {d.statut === 'EN_ATTENTE' && (
                              <>
                                <button onClick={() => { setApprouverTarget(d); setCommentaireApp(''); }} style={{ height: 26, padding: '0 8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Approuver</button>
                                <button onClick={() => { setRejeterTarget(d); setMotifRejet(''); }} style={{ height: 26, padding: '0 8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Rejeter</button>
                              </>
                            )}
                            {d.statut !== 'EN_ATTENTE' && <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{d.commentaireAdmin ?? '—'}</span>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: d.statut === 'APPROUVEE' ? '#16a34a' : d.statut === 'REJETEE' ? '#dc2626' : '#94a3b8', fontStyle: d.commentaireAdmin ? 'italic' : 'normal' }}>
                            {d.commentaireAdmin ?? (d.statut === 'EN_ATTENTE' ? 'En cours…' : '—')}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div style={{ flexShrink: 0, padding: '10px 18px', borderTop: '1px solid #eef2f6' }}>
                <PaginationControls page={redPage} total={demandes.length} onPageChange={setRedPage} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'passages' && (
        <>
          <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginRight: 8 }}>
              {isAdmin ? 'Demandes de passage en classe supérieure' : 'Vos demandes de passage'}
            </div>
            {[['', 'Toutes'], ['EN_ATTENTE', 'En attente'], ['APPROUVEE', 'Approuvées'], ['REJETEE', 'Rejetées']].map(([val, label]) => (
              <button key={val} onClick={() => setPassageFilter(val)}
                style={{ height: 32, padding: '0 12px', border: `1px solid ${passageFilter === val ? '#2563eb' : '#e2e8f0'}`, background: passageFilter === val ? '#2563eb' : '#fff', color: passageFilter === val ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', padding: '12px 28px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 110px 1fr', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0, gap: 14, alignItems: 'center', textAlign: 'left' }}>
                {['Élève', 'Classe demandée', 'Année', 'Motif', 'Statut', isAdmin ? 'Actions' : 'Réponse'].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>)}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {passageLoading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement...</div>
                  : passages.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucune demande de passage</div>
                  : pagedPassages.map((d, idx) => {
                    const st = STATUT_RED[d.statut];
                    const ini = ((d.eleve?.firstName?.[0] ?? '') + (d.eleve?.lastName?.[0] ?? '')).toUpperCase();
                    return (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 110px 1fr', alignItems: 'center', textAlign: 'left', padding: '11px 18px', borderBottom: idx < pagedPassages.length - 1 ? '1px solid #eef2f6' : 'none', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{ini}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.eleve?.firstName} {d.eleve?.lastName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.eleve?.matricule ?? relDate(d.createdAt)}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{d.classeDest?.nom ?? '—'}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{d.anneeAcademique?.libelle ?? '—'}</span>
                        <div style={{ fontSize: 12, color: '#475569', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{d.motif ?? '—'}</div>
                        <span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, flexShrink: 0, display: 'inline-block' }} />{st.label}
                          </span>
                        </span>
                        {isAdmin ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            {d.statut === 'EN_ATTENTE' ? (
                              <>
                                <button onClick={() => handleApprouverPassage(d.id)} style={{ height: 26, padding: '0 8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Approuver</button>
                                <button onClick={() => handleRejeterPassage(d.id)} style={{ height: 26, padding: '0 8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Rejeter</button>
                              </>
                            ) : <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{d.motifRefus ?? '—'}</span>}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: d.statut === 'APPROUVEE' ? '#16a34a' : d.statut === 'REJETEE' ? '#dc2626' : '#94a3b8' }}>{d.motifRefus ?? (d.statut === 'EN_ATTENTE' ? 'En cours…' : '—')}</span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div style={{ flexShrink: 0, padding: '10px 18px', borderTop: '1px solid #eef2f6' }}>
                <PaginationControls page={passagePage} total={passages.length} onPageChange={setPassagePage} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ─── Modal Nouvelle inscription ─── */}
      {inscModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 640, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Nouvelle inscription</div>
              <button onClick={() => setInscModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              {/* Année */}
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Année :</span>
                {anneeCourante ? <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 9px' }}>{anneeCourante.libelle}</span> : <span style={{ fontSize: 12, color: '#dc2626' }}>Non configurée</span>}
              </div>
              {/* Élève search */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Élève</div>
              <div ref={eleveRef} style={{ position: 'relative', marginBottom: inscErrors.eleve ? 4 : 14 }}>
                {selectedEleve ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #a7f3d0', background: '#f0fdf4', padding: '0 12px', height: 38 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <div style={{ flex: 1 }}><strong style={{ fontSize: 13, color: '#0f172a' }}>{selectedEleve.firstName} {selectedEleve.lastName}</strong>{selectedEleve.matricule && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{selectedEleve.matricule}</span>}</div>
                    <button onClick={clearEleve} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15 }}>✕</button>
                  </div>
                ) : (
                  <input value={eleveSearch} onChange={e => { setEleveSearch(e.target.value); setEleveDropOpen(true); }} onFocus={() => { if (eleveSearch) setEleveDropOpen(true); }} placeholder="Rechercher par nom, matricule..." style={inp(inscAttempted && !selectedEleve)} autoFocus />
                )}
                {eleveDropOpen && !selectedEleve && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d9e0e8', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, maxHeight: 180, overflowY: 'auto' }}>
                    {eleveLoading && <div style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>Recherche...</div>}
                    {!eleveLoading && eleveResults.length === 0 && eleveSearch.trim() && <div style={{ padding: '10px 14px', fontSize: 13, color: '#64748b' }}>Aucun élève trouvé</div>}
                    {eleveResults.map(e => (
                      <div key={e.id} onClick={() => selectEleve(e)} style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')} onMouseLeave={ev => (ev.currentTarget.style.background = '#fff')}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.firstName} {e.lastName}</div>
                        {e.matricule && <div style={{ fontSize: 11, color: '#94a3b8' }}>{e.matricule}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errTxt(inscErrors.eleve)}
              {/* Suggestion */}
              {suggestionLoading && <div style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 12px' }}>Chargement historique...</div>}
              {suggestion && !suggestionLoading && (
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 12px', margin: '10px 0 16px', fontSize: 12, color: '#475569' }}>
                  {suggestion.lastInscription ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                      <span>Dernière classe : <strong>{suggestion.lastInscription.classe.nom}</strong></span>
                      {suggestion.lastInscription.statut === 'EXCLU' && <span style={{ color: '#dc2626', fontWeight: 700 }}>Exclu</span>}
                      {suggestion.moyenne != null && <span>Moy. : <strong style={{ color: suggestion.peutPasser ? '#16a34a' : '#dc2626' }}>{suggestion.moyenne.toFixed(2)}</strong></span>}
                      {suggestion.peutPasser ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Peut passer</span> : suggestion.nextNiveau && <span style={{ color: '#dc2626', fontWeight: 700 }}>Passage soumis à validation admin</span>}
                    </div>
                  ) : <span style={{ color: '#7c3aed', fontWeight: 600 }}>Première inscription</span>}
                  {suggestion.impayesCount > 0 && <div style={{ marginTop: 6, color: '#dc2626', fontWeight: 600 }}>⚠ {suggestion.impayesCount} paiement(s) en attente</div>}
                  {suggestion.frais && <div style={{ marginTop: 6 }}>Frais niveau : <strong>{fmt(suggestion.frais.inscription)} F</strong> inscrip. · <strong>{fmt(suggestion.frais.mensualite)} F</strong>/mois × {suggestion.frais.nbMois}</div>}
                </div>
              )}
              {/* Classe & frais */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Classe &amp; frais</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 6 }}>
                <div>
                  <label style={lbl()}>Classe <span style={{ color: '#dc2626' }}>*</span></label>
                  <select value={classeId} onChange={e => setClasseId(e.target.value)} style={{ ...inp(!!inscErrors.classe), cursor: 'pointer' }}>
                    <option value="">Sélectionner...</option>
                    {classesSuggestion.map(c => {
                      const places = c.placesRestantes ?? (c.effectifMax ? c.effectifMax - (c.nbEleves ?? 0) : null);
                      const placesTxt = places !== null ? ` — ${places} place(s) restante(s)` : '';
                      return <option key={c.id} value={c.id}>{c.nom}{placesTxt}</option>;
                    })}
                  </select>
                  {errTxt(inscErrors.classe)}
                </div>
                <div>
                  <label style={lbl()}>Frais d&apos;inscription</label>
                  {(() => {
                    const pct = Number(reductionPct || '0');
                    const hasValidCoupon = hasReduction && pct >= 1 && pct <= 100 && fraisBase != null && fraisNet != null;
                    const showNet = isAdmin && hasValidCoupon;
                    const showPreview = !isAdmin && hasValidCoupon;
                    return (
                      <div style={{ height: 38, border: `1px solid ${showNet ? '#fde68a' : showPreview ? '#bae6fd' : '#e2e8f0'}`, padding: '0 12px', background: showNet ? '#fffbeb' : showPreview ? '#f0f9ff' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
                        {showNet ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 12 }}>{fmt(fraisBase!)} F</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{fmt(fraisNet!)} F</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '1px 5px', marginLeft: 'auto' }}>−{pct}%</span>
                          </>
                        ) : showPreview ? (
                          <>
                            <span style={{ fontSize: 13, color: '#0c4a6e', fontWeight: 600 }}>{fraisBase != null ? `${fmt(fraisBase!)} F` : 'Auto'}</span>
                            <span style={{ fontSize: 10, color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', marginLeft: 'auto' }}>−{pct}% si approuvé → {fmt(fraisNet!)} F</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 13, color: fraisBase != null ? '#0f172a' : '#94a3b8' }}>{fraisBase != null ? `${fmt(fraisBase)} F` : 'Auto (selon niveau)'}</span>
                            {fraisBase != null && <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                          </>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Depuis config niveau</div>
                </div>
              </div>
              {!isAdmin && suggestion?.lastInscription && !suggestion.peutPasser && suggestion.nextNiveau && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 12px', margin: '0 0 16px', fontSize: 12, color: '#9a3412' }}>
                  <label style={lbl('#9a3412')}>Motif de demande de passage</label>
                  <textarea
                    value={motifPassage}
                    onChange={e => setMotifPassage(e.target.value)}
                    placeholder="Expliquez pourquoi l'élève devrait passer malgré la moyenne insuffisante"
                    rows={2}
                    style={{ width: '100%', border: '1px solid #fed7aa', padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div style={{ marginTop: 5 }}>Si l’inscription est refusée par la règle de moyenne, cette demande sera envoyée à l’admin.</div>
                </div>
              )}
              {/* Réduction */}
              <div style={{ background: isAdmin ? '#fffbeb' : '#f0f9ff', border: `1px solid ${isAdmin ? '#fde68a' : '#bae6fd'}`, padding: '11px 13px', margin: '12px 0 16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasReduction} onChange={e => { setHasReduction(e.target.checked); if (!e.target.checked) { setReductionPct(''); setMotifReduction(''); } else if (!isAdmin) { setHasPaiement(false); setMontantRecu(''); } }} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: isAdmin ? '#d97706' : '#0284c7' }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isAdmin ? '#92400e' : '#0c4a6e' }}>{isAdmin ? 'Appliquer une réduction / bourse' : 'Demander une réduction / bourse'}</span>
                    {!isAdmin && <div style={{ fontSize: 11, color: '#0369a1' }}>Nécessite validation admin</div>}
                  </div>
                </label>
                {hasReduction && (
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'start' }}>
                    <div>
                      <label style={lbl(isAdmin ? '#92400e' : '#0c4a6e')}>% de réduction <span style={{ color: '#dc2626' }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input type="number" min="1" max="100" value={reductionPct} onChange={e => setReductionPct(e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder="Ex : 50" style={{ ...inp(!!inscErrors.reductionPct), paddingRight: 28 }} />
                        <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748b', pointerEvents: 'none' }}>%</span>
                      </div>
                      {errTxt(inscErrors.reductionPct)}
                    </div>
                    {fraisBase != null && reductionPct && !inscErrors.reductionPct ? (
                      <div style={{ background: '#fff', border: `1px solid ${isAdmin ? '#fde68a' : '#bae6fd'}`, padding: '9px 12px', fontSize: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: '#475569' }}>Base : <strong>{fmt(fraisBase)} F</strong></span>
                          <span style={{ color: isAdmin ? '#d97706' : '#0284c7' }}>Réd. : <strong>− {fmt(fraisBase - (fraisNet ?? fraisBase))} F</strong></span>
                          <span style={{ fontWeight: 700, color: isAdmin ? '#16a34a' : '#0284c7', borderTop: `1px solid ${isAdmin ? '#fde68a' : '#bae6fd'}`, paddingTop: 3, marginTop: 2 }}>{isAdmin ? 'Net : ' : 'Si approuvé : '}{fmt(fraisNet ?? fraisBase)} F</span>
                        </div>
                      </div>
                    ) : null}
                    {!isAdmin && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={lbl('#0c4a6e')}>Motif de la demande <span style={{ color: '#dc2626' }}>*</span></label>
                        <textarea value={motifReduction} onChange={e => setMotifReduction(e.target.value)} placeholder="Ex : Élève boursier, situation familiale difficile..." rows={2} style={{ width: '100%', border: `1px solid ${inscErrors.motifReduction ? '#f87171' : '#bae6fd'}`, padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: inscErrors.motifReduction ? '#fff5f5' : '#fff', resize: 'vertical' }} />
                        {errTxt(inscErrors.motifReduction)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Paiement */}
              <div style={{ borderTop: '1px solid #e6ebf1', paddingTop: 14 }}>
                {!isAdmin && hasReduction && reductionPct ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
                    Le paiement ne peut être enregistré qu&apos;après validation de la demande de réduction par l&apos;administration.
                  </div>
                ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: hasPaiement ? 12 : 0 }}>
                  <input type="checkbox" checked={hasPaiement} onChange={e => { setHasPaiement(e.target.checked); if (e.target.checked && (isAdmin ? fraisNet : fraisBase) != null && !montantRecu) setMontantRecu(String(isAdmin ? fraisNet : fraisBase)); }} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Un paiement a été reçu lors de l&apos;inscription</span>
                </label>
                )}
                {hasPaiement && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '14px 12px' }}>
                    {!isAdmin && hasReduction && reductionPct && (
                      <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', padding: '7px 10px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                        Montant sur frais de base ({fraisBase != null ? `${fmt(fraisBase)} F` : '—'}). Réduction appliquée après validation.
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={lbl()}>Mode de paiement</label>
                        <select value={modePaiement} onChange={e => setModePaiement(e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
                          {MODE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl()}>Montant reçu (F CFA) <span style={{ color: '#dc2626' }}>*</span></label>
                        {(() => { const ref = isAdmin ? fraisNet : fraisBase; return (<><input type="number" value={montantRecu} onChange={e => setMontantRecu(e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder={ref != null ? fmt(ref) : 'Ex : 150 000'} style={inp(!!inscErrors.montantRecu)} />{errTxt(inscErrors.montantRecu)}</>); })()}
                      </div>
                    </div>
                    {(() => {
                      const ref = isAdmin ? fraisNet : fraisBase;
                      const reste = ref != null && montantRecu ? Math.max(0, ref - Number(montantRecu)) : 0;
                      if (ref == null || !montantRecu || inscErrors.montantRecu) return null;
                      return (
                        <div style={{ display: 'flex', border: '1px solid #e2e8f0', marginBottom: 10 }}>
                          {[{ label: isAdmin ? 'Frais nets' : 'Frais de base', v: `${fmt(ref)} F`, c: '#0f172a', bg: '#fff' }, { label: 'Reçu', v: `${fmt(Number(montantRecu))} F`, c: '#16a34a', bg: '#f0fdf4' }, { label: 'Reste', v: reste > 0 ? `${fmt(reste)} F` : 'Soldé ✓', c: reste > 0 ? '#d97706' : '#16a34a', bg: reste > 0 ? '#fffbeb' : '#f0fdf4' }].map((s, i) => (
                            <div key={s.label} style={{ flex: 1, padding: '8px 10px', background: s.bg, borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
                              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, textTransform: 'uppercase' }}>{s.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {(modePaiement === 'ORANGE_MONEY' || modePaiement === 'WAVE' || modePaiement === 'VIREMENT') && (
                      <div><label style={lbl()}>Réf. transaction <span style={{ color: '#94a3b8' }}>(optionnel)</span></label><input value={refTransaction} onChange={e => setRefTransaction(e.target.value)} placeholder="Ex : OM-2026-123456" style={inp()} /></div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid #e6ebf1', flexShrink: 0 }}>
              <button onClick={() => setInscModalOpen(false)} style={{ height: 40, padding: '0 18px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleInscSave} disabled={inscSaving} style={{ height: 40, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: inscSaving ? 0.7 : 1 }}>{inscSaving ? 'Inscription...' : 'Inscrire'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Transfert ─── */}
      {transferTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 420, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Transfert de classe</div>
              <button onClick={() => setTransferTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 13px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{transferTarget.eleve?.firstName} {transferTarget.eleve?.lastName}</div>
                <div style={{ fontSize: 12, color: '#2563eb', marginTop: 3 }}>Actuelle : <strong>{transferTarget.classe?.nom ?? '—'}</strong></div>
              </div>
              <label style={lbl()}>Nouvelle classe <span style={{ color: '#dc2626' }}>*</span></label>
              <select value={newClasseId} onChange={e => setNewClasseId(e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
                <option value="">Sélectionner...</option>
                {allClasses.filter(c => c.id !== transferTarget.classeId).map(c => {
                      const places = c.placesRestantes ?? (c.effectifMax ? c.effectifMax - (c.nbEleves ?? 0) : null);
                      return <option key={c.id} value={c.id}>{c.nom}{places !== null ? ` (${places} places)` : ''}</option>;
                    })}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 22px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setTransferTarget(null)} style={{ height: 36, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleTransfer} disabled={transferSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: transferSaving ? 0.7 : 1 }}>{transferSaving ? '...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Paiement dette ─── */}
      {debtTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 390, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Confirmer le paiement</div>
              <button onClick={() => setDebtTarget(null)} disabled={debtSaving} style={{ background: 'none', border: 'none', cursor: debtSaving ? 'not-allowed' : 'pointer', opacity: debtSaving ? 0.5 : 1 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#9a3412', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Dette inscription</div>
                <div style={{ fontSize: 28, color: '#c2410c', fontWeight: 800, marginTop: 4 }}>{fmt(debtTarget.montant)} F</div>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#64748b' }}>Élève</span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>{debtTarget.inscription.eleve?.firstName} {debtTarget.inscription.eleve?.lastName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#64748b' }}>Classe</span>
                  <strong style={{ color: '#2563eb', textAlign: 'right' }}>{debtTarget.inscription.classe?.nom ?? '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: '#64748b' }}>Année</span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>{debtTarget.inscription.anneeAcademique?.libelle ?? anneeCourante?.libelle ?? '—'}</strong>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Mode de paiement</label>
                <select value={debtMode} onChange={(e) => setDebtMode(e.target.value)} style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money (Wave, OM)</option>
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setDebtTarget(null)} disabled={debtSaving} style={{ height: 36, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: debtSaving ? 'not-allowed' : 'pointer', opacity: debtSaving ? 0.6 : 1 }}>Annuler</button>
              <button onClick={handlePayDebt} disabled={debtSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#c2410c', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: debtSaving ? 'wait' : 'pointer', opacity: debtSaving ? 0.75 : 1 }}>{debtSaving ? 'Paiement...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal dette mensualité ─── */}
      {mensuDebtTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 390, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Compléter la mensualité</div>
              <button onClick={() => setMensuDebtTarget(null)} disabled={mensuDebtSaving} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#9a3412', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Reste à payer</div>
                <div style={{ fontSize: 28, color: '#c2410c', fontWeight: 800, marginTop: 4 }}>{fmt(Math.round(Number(mensuDebtTarget._dette ?? 0)))} F</div>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Mois</span>
                  <strong>{String(mensuDebtTarget.trimestre ?? '').replace('MOIS_', 'Mois ')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Montant total</span>
                  <strong>{fmt(mensuDebtTarget.montant)} F</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Déjà payé</span>
                  <strong style={{ color: '#16a34a' }}>{fmt(mensuDebtTarget.montant - Math.round(Number(mensuDebtTarget._dette ?? 0)))} F</strong>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Mode de paiement</label>
                <select value={mensuDebtMode} onChange={(e) => setMensuDebtMode(e.target.value)} style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money (Wave, OM)</option>
                  <option value="VIREMENT">Virement bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setMensuDebtTarget(null)} disabled={mensuDebtSaving} style={{ height: 36, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleConfirmMensuDebt()} disabled={mensuDebtSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#c2410c', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: mensuDebtSaving ? 'wait' : 'pointer', opacity: mensuDebtSaving ? 0.75 : 1 }}>{mensuDebtSaving ? 'Paiement...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Paiement mensualité ─── */}
      {paiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 480, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Enregistrer une mensualité</div>
              <button onClick={() => setPaiModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Élève */}
              <div>
                <label style={lbl()}>Élève <span style={{ color: '#dc2626' }}>*</span></label>
                <div ref={paiEleveRef} style={{ position: 'relative' }}>
                  {paiSelectedEleve ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #a7f3d0', background: '#f0fdf4', padding: '0 12px', height: 38 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                        {paiSelectedEleve.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={paiSelectedEleve.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : `${paiSelectedEleve.firstName?.[0] ?? ''}${paiSelectedEleve.lastName?.[0] ?? ''}`.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{paiSelectedEleve.firstName} {paiSelectedEleve.lastName}</div>
                      <button onClick={() => { setPaiSelectedEleve(null); setPaiSelectedInscription(null); setPaiSelectedMonths([]); setPaiMonthlyAmount(null); setPaiReductionPct(0); setPaiPaidMonths(new Set()); setPaiEleveSearch(''); setPaiAmountReceived(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                    </div>
                  ) : (
                    <input value={paiEleveSearch} onChange={e => { setPaiEleveSearch(e.target.value); setPaiEleveDropOpen(true); }} placeholder="Rechercher un élève..." style={inp()} autoFocus />
                  )}
                  {paiEleveDropOpen && !paiSelectedEleve && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d9e0e8', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, maxHeight: 160, overflowY: 'auto' }}>
                      {paiEleveResults.map(e => (
                        <div key={e.id} onClick={() => { setPaiSelectedEleve(e); setPaiEleveSearch(''); setPaiEleveDropOpen(false); }} style={{ padding: '9px 13px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13, display: 'flex', alignItems: 'center', gap: 9 }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = '#f8fafc')} onMouseLeave={ev => (ev.currentTarget.style.background = '#fff')}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                            {e.photoUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={e.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : `${e.firstName?.[0] ?? ''}${e.lastName?.[0] ?? ''}`.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.firstName} {e.lastName}</div>
                            {e.matricule && <div style={{ fontSize: 11, color: '#94a3b8' }}>{e.matricule}</div>}
                          </div>
                        </div>
                      ))}
                      {paiEleveResults.length === 0 && paiEleveSearch.trim() && <div style={{ padding: '10px 13px', fontSize: 13, color: '#64748b' }}>Aucun résultat</div>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                  {MONTH_OPTIONS.map((month) => {
                    const checked = paiSelectedMonths.includes(month.value);
                    const disabled = paiPaidMonths.has(month.value);
                    return (
                      <label key={month.value} title={disabled ? 'Mois déjà payé' : undefined} style={{ height: 32, border: `1px solid ${checked ? '#16a34a' : disabled ? '#e2e8f0' : '#e2e8f0'}`, background: disabled ? '#f1f5f9' : checked ? '#f0fdf4' : '#fff', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, color: disabled ? '#94a3b8' : checked ? '#166534' : '#475569', fontWeight: 600, opacity: disabled ? 0.75 : 1 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(e) => setPaiSelectedMonths((months) => e.target.checked ? [...months, month.value] : months.filter((m) => m !== month.value))}
                          style={{ accentColor: '#16a34a' }}
                        />
                        {month.label}
                        {disabled && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Mensualité</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: paiMonthlyAmount ? '#0f172a' : '#94a3b8' }}>{paiMonthlyAmount ? `${fmt(paiMonthlyAmount)} F` : 'Auto niveau'}</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Réduction</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: paiReductionPct > 0 ? '#16a34a' : '#64748b' }}>{paiReductionPct > 0 ? `−${paiReductionPct}%` : '—'}</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #bbf7d0', padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Total</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{fmt(paiTotalSelection)} F</div>
                  </div>
                </div>
                {paiSelectedEleve && !paiSelectedInscription && <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626' }}>Aucune inscription active trouvée pour cet élève.</div>}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 12 }}>
                <label style={lbl()}>Montant reçu</label>
                <input type="number" min="1" max={paiTotalSelection || undefined} value={paiAmountReceived} onChange={e => setPaiAmountReceived(e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder={paiTotalSelection ? fmt(paiTotalSelection) : '0'} style={inp()} />
                {paiTotalSelection > 0 && (() => {
                  const received = Math.round(Number(paiAmountReceived || paiTotalSelection));
                  const debt = Math.max(0, paiTotalSelection - (Number.isFinite(received) ? received : 0));
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                      {[{ label: 'À payer', value: `${fmt(paiTotalSelection)} F`, color: '#0f172a' }, { label: 'Reçu', value: `${fmt(Number.isFinite(received) ? received : 0)} F`, color: '#16a34a' }, { label: 'Dette', value: debt > 0 ? `${fmt(debt)} F` : 'Soldé ✓', color: debt > 0 ? '#dc2626' : '#16a34a' }].map((item) => (
                        <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '7px 9px' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{item.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginTop: 2 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl()}>Mode de paiement</label>
                  <select value={paiMode} onChange={e => setPaiMode(e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
                    {MODE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                {(paiMode === 'ORANGE_MONEY' || paiMode === 'WAVE' || paiMode === 'VIREMENT') && (
                  <div>
                    <label style={lbl()}>N° transaction</label>
                    <input value={paiRef} onChange={e => setPaiRef(e.target.value)} placeholder="Optionnel" style={inp()} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 22px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setPaiModalOpen(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handlePaiSave} disabled={paiSaving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: paiSaving ? 0.7 : 1 }}>{paiSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Approuver réduction ─── */}
      {approuverTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 440, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Approuver la réduction</div>
              <button onClick={() => setApprouverTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '11px 13px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{approuverTarget.eleve?.firstName} {approuverTarget.eleve?.lastName}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a' }}>{approuverTarget.pourcentage}%</div>
                </div>
                <div style={{ fontSize: 12, color: '#475569', borderTop: '1px solid #bbf7d0', paddingTop: 6 }}><strong>Motif :</strong> {approuverTarget.motif}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Demandé par {approuverTarget.demandeParUser?.email ?? `${approuverTarget.demandeParUser?.firstName ?? ''} ${approuverTarget.demandeParUser?.lastName ?? ''}`.trim()}</div>
              </div>
              <label style={lbl()}>Commentaire <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span></label>
              <textarea value={commentaireApp} onChange={e => setCommentaireApp(e.target.value)} placeholder="Ex : Bourse accordée selon dossier social" rows={3} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 22px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setApprouverTarget(null)} style={{ height: 36, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleApprouver} disabled={appSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: appSaving ? 0.7 : 1 }}>{appSaving ? '...' : 'Confirmer l\'approbation'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Rejeter réduction ─── */}
      {rejeterTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 440, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Rejeter la demande</div>
              <button onClick={() => setRejeterTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', padding: '10px 13px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{rejeterTarget.eleve?.firstName} {rejeterTarget.eleve?.lastName} — {rejeterTarget.pourcentage}%</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}><strong>Motif initial :</strong> {rejeterTarget.motif}</div>
              </div>
              <label style={lbl()}>Motif de rejet <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)} placeholder="Ex : Dossier incomplet, critères non remplis..." rows={3} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 22px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setRejeterTarget(null)} style={{ height: 36, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleRejeter} disabled={rejSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: rejSaving ? 0.7 : 1 }}>{rejSaving ? '...' : 'Confirmer le rejet'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
