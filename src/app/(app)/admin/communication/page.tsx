'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  useAdminClasses,
  useAdminCommunications,
  useAdminAnneesAcademiques,
  useCreateCommunication,
  useUpdateCommunication,
  useDeleteCommunication,
  usePreviewCommunicationDestinataires,
} from '@/hooks/use-query-api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type Canal = 'NOTIFICATION' | 'SMS' | 'EMAIL' | 'WHATSAPP';
type Statut = 'PLANIFIE' | 'ENVOYE' | 'ECHEC' | 'BROUILLON';
type Cible = 'TOUS' | 'ELEVES' | 'PARENTS' | 'ENSEIGNANTS' | 'PERSONNEL' | 'RH' | 'COMPTABLES' | 'CAISSIERS' | 'SURVEILLANTS' | 'SECURITE' | 'ADMINISTRATION' | 'CLASSE';

interface DocItem { url: string; nom: string; mimeType: string; taille?: number }

interface Message {
  id: string;
  titre: string;
  contenu: string;
  canal: Canal;
  cible: Cible;
  roles?: string[];
  classeId?: string;
  classeLabel?: string;
  statut: Statut;
  dateEnvoi?: string;
  dateCreation: string;
  nbDestinataires: number;
  nbLus?: number;
  auteur: string;
  documents: DocItem[];
}

type ClasseItem = { id: string; nom: string };
type AnneeItem = { id: string; libelle: string; active: boolean };
type PreviewResult = { total?: number; parRole?: Record<string, number> };
type DocumentPayload = { nom: string; mimeType: string; taille: number; base64: string };

const CANAL_LABELS: Record<Canal, string> = { NOTIFICATION: 'Notification', SMS: 'SMS', EMAIL: 'E-mail', WHATSAPP: 'WhatsApp' };
const CANAL_COLORS: Record<Canal, string> = { NOTIFICATION: '#2563eb', SMS: '#0369a1', EMAIL: '#2563eb', WHATSAPP: '#16a34a' };
const STATUT_LABELS: Record<Statut, string> = { PLANIFIE: 'Planifié', ENVOYE: 'Envoyé', ECHEC: 'Échec', BROUILLON: 'Brouillon' };
const STATUT_COLORS: Record<Statut, string> = { PLANIFIE: '#d97706', ENVOYE: '#16a34a', ECHEC: '#dc2626', BROUILLON: '#94a3b8' };
const BORDER = '#d9e0e8';
const BORDER_SOFT = '#e6ebf1';
const PANEL_BG = '#f8fafc';
const MAX_DOCUMENT_BYTES = 10_000_000;
const ALLOWED_DOCUMENT_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const CIBLE_OPTIONS: { value: Cible; label: string }[] = [
  { value: 'TOUS', label: 'Tous les utilisateurs' },
  { value: 'ELEVES', label: 'Élèves' },
  { value: 'PARENTS', label: 'Parents' },
  { value: 'ENSEIGNANTS', label: 'Professeurs' },
  { value: 'RH', label: 'RH' },
  { value: 'COMPTABLES', label: 'Comptables' },
  { value: 'CAISSIERS', label: 'Caissiers' },
  { value: 'SURVEILLANTS', label: 'Surveillants' },
  { value: 'SECURITE', label: 'Sécurité / Gardiens' },
  { value: 'PERSONNEL', label: 'Tout le personnel' },
  { value: 'ADMINISTRATION', label: 'Administration' },
  { value: 'CLASSE', label: 'Classe spécifique' },
];

const CIBLE_LABELS: Record<Cible, string> = Object.fromEntries(CIBLE_OPTIONS.map(o => [o.value, o.label])) as Record<Cible, string>;

// Correspondance cible UI → rôles réels en base (UserRole enum)
const CIBLE_TO_ROLES: Partial<Record<Cible, string[]>> = {
  TOUS: [],
  ELEVES: ['ELEVE'],
  PARENTS: ['PARENT'],
  ENSEIGNANTS: ['ENSEIGNANT'],
  RH: ['RH'],
  COMPTABLES: ['COMPTABLE'],
  CAISSIERS: ['CAISSIER'],
  SURVEILLANTS: ['SURVEILLANT'],
  SECURITE: ['SECURITE'],
  PERSONNEL: ['RH', 'COMPTABLE', 'CAISSIER', 'SURVEILLANT', 'SECURITE'],
  ADMINISTRATION: ['ADMIN'],
  CLASSE: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

function asArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const rows = obj.content ?? obj.data;
    return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
  }
  return [];
}

function formatFileSize(size?: number) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? '').split(',').pop() ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizePreviewResult(value: unknown): PreviewResult | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const source = obj.data && typeof obj.data === 'object' ? obj.data as Record<string, unknown> : obj;
  return {
    total: typeof source.total === 'number' ? source.total : undefined,
    parRole: source.parRole && typeof source.parRole === 'object' ? source.parRole as Record<string, number> : undefined,
  };
}

function docIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType?.startsWith('image/')) return 'IMG';
  return 'DOC';
}

function normalizeMessage(row: Record<string, unknown>): Message {
  const cible = String(row.cible ?? 'TOUS').toUpperCase() as Cible;
  const classeIds = Array.isArray(row.classeIds) ? row.classeIds : [];

  // Normalise documents : tableau backend ou document legacy unique
  let docs: DocItem[] = [];
  if (Array.isArray(row.documents) && (row.documents as unknown[]).length > 0) {
    docs = (row.documents as Record<string, unknown>[]).map(d => ({
      url: String(d.url ?? ''),
      nom: String(d.nom ?? 'Document'),
      mimeType: String(d.mimeType ?? ''),
      taille: d.taille !== undefined ? Number(d.taille) : undefined,
    }));
  } else {
    const docObj = row.document && typeof row.document === 'object' ? row.document as Record<string, unknown> : {};
    const url = String(row.documentUrl ?? docObj.url ?? '');
    if (url) {
      docs = [{ url, nom: String(row.documentNom ?? docObj.nom ?? 'Document'), mimeType: String(row.documentMimeType ?? docObj.mimeType ?? ''), taille: row.documentTaille !== undefined ? Number(row.documentTaille) : undefined }];
    }
  }

  return {
    id: String(row.id ?? ''),
    titre: String(row.titre ?? ''),
    contenu: String(row.contenu ?? ''),
    canal: String(row.canal ?? 'NOTIFICATION').toUpperCase() as Canal,
    cible,
    roles: Array.isArray(row.roles) ? (row.roles as unknown[]).map(String) : undefined,
    classeId: String(row.classeId ?? classeIds[0] ?? ''),
    classeLabel: String(row.classeNom ?? row.classeLabel ?? ''),
    statut: String(row.statut ?? 'BROUILLON').toUpperCase() as Statut,
    dateEnvoi: row.dateEnvoi ? String(row.dateEnvoi) : row.envoyeLe ? String(row.envoyeLe) : undefined,
    dateCreation: String(row.dateCreation ?? row.createdAt ?? new Date().toISOString()),
    nbDestinataires: Number(row.nbDestinataires ?? 0),
    nbLus: row.nbLus === undefined ? undefined : Number(row.nbLus),
    auteur: String(row.auteur ?? 'Direction'),
    documents: docs,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommunicationPage() {
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS');
  const [filtreCanal, setFiltreCanal] = useState<string>('TOUS');
  const [filtreCible, setFiltreCible] = useState<string>('TOUS');
  const [filtreAnnee, setFiltreAnnee] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Message | null>(null);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null);

  const queryParams: Record<string, unknown> = {};
  if (filtreStatut !== 'TOUS') queryParams.statut = filtreStatut;
  if (filtreCanal !== 'TOUS') queryParams.canal = filtreCanal;
  if (filtreCible !== 'TOUS') queryParams.cible = filtreCible;
  if (filtreAnnee) queryParams.anneeAcademiqueId = filtreAnnee;

  const { data: communicationsData, isLoading } = useAdminCommunications(queryParams);
  const { data: classesData } = useAdminClasses({ size: 500 });
  const { data: anneesData } = useAdminAnneesAcademiques();
  const createCommunication = useCreateCommunication();
  const updateCommunication = useUpdateCommunication();
  const deleteCommunication = useDeleteCommunication();
  const previewDestinataires = usePreviewCommunicationDestinataires();
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  // Formulaire
  const [form, setForm] = useState({ titre: '', contenu: '', canal: 'NOTIFICATION' as Canal, classeId: '', dateEnvoi: '', envoiImmediat: true });
  // Multi-select cibles
  const [selectedCibles, setSelectedCibles] = useState<Cible[]>(['TOUS']);
  // Multi-documents
  const [documents, setDocuments] = useState<DocumentPayload[]>([]);
  const [docError, setDocError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Données normalisées
  const rawMessages = asArray(communicationsData).map(normalizeMessage);
  // Tri : plus récent → plus ancien
  const messages = [...rawMessages].sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

  const classes: ClasseItem[] = asArray(classesData).map(c => ({ id: String(c.id ?? ''), nom: String(c.nom ?? c.libelle ?? c.code ?? '') })).filter(c => !!c.id);
  const annees: AnneeItem[] = asArray(anneesData).map(a => ({
    id: String(a.id ?? ''),
    libelle: String(a.libelle ?? a.annee ?? a.label ?? a.id ?? ''),
    active: a.active === true || a.actif === true || a.statut === 'OUVERTE',
  }));
  const anneeActive = annees.find(a => a.active) ?? null;

  // Le filtre année reste sur « Toutes les années » par défaut.
  //
  // Il était auto-positionné sur l'année active, ce qui masquait tous les
  // messages dont `anneeAcademiqueId` est null — c'est-à-dire l'intégralité
  // de l'historique. La page affichait « 0 message » alors que l'API en
  // retournait 7. L'utilisateur choisit désormais explicitement une année.

  const filtered = messages.filter(m => {
    if (filtreStatut !== 'TOUS' && m.statut !== filtreStatut) return false;
    if (filtreCanal !== 'TOUS' && m.canal !== filtreCanal) return false;
    if (filtreCible !== 'TOUS' && m.cible !== filtreCible) return false;
    return true;
  });

  function cibleLabel(message: Message) {
    if (message.roles && message.roles.length > 1) return message.roles.join(', ');
    if (message.cible !== 'CLASSE') return CIBLE_LABELS[message.cible] ?? message.cible;
    return message.classeLabel || classes.find(c => c.id === message.classeId)?.nom || 'Classe';
  }

  // ── Cibles multi-select ───────────────────────────────────────────────────
  function toggleCible(cible: Cible, checked: boolean) {
    setPreview(null);
    if (checked) {
      if (cible === 'TOUS') { setSelectedCibles(['TOUS']); return; }
      setSelectedCibles(prev => {
        const without = prev.filter(c => c !== 'TOUS');
        return without.includes(cible) ? without : [...without, cible];
      });
    } else {
      setSelectedCibles(prev => {
        const next = prev.filter(c => c !== cible);
        return next.length ? next : ['TOUS']; // toujours au moins un
      });
    }
  }

  // ── Documents multi ────────────────────────────────────────────────────────
  async function handleFilesChange(files: FileList | null) {
    if (!files) return;
    setDocError('');
    const toAdd: DocumentPayload[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_DOCUMENT_MIME.has(file.type)) { setDocError(`Format non autorisé : ${file.name}`); continue; }
      if (file.size > MAX_DOCUMENT_BYTES) { setDocError(`Fichier trop volumineux (max 10 Mo) : ${file.name}`); continue; }
      try {
        const base64 = await fileToBase64(file);
        toAdd.push({ nom: file.name, mimeType: file.type, taille: file.size, base64 });
      } catch { setDocError(`Lecture impossible : ${file.name}`); }
    }
    setDocuments(prev => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeDocument(index: number) {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  }

  // ── Payload ────────────────────────────────────────────────────────────────
  function buildPayload(brouillon = false) {
    const hasClasse = selectedCibles.includes('CLASSE');
    const roleCibles = selectedCibles.filter(c => c !== 'CLASSE');
    const isTous = roleCibles.includes('TOUS') || roleCibles.length === 0;
    const classe = classes.find(c => c.id === form.classeId);
    // Convertit les valeurs UI (ex: 'ELEVES') vers les vrais rôles DB (ex: 'ELEVE')
    const actualRoles = isTous ? [] : [...new Set(roleCibles.flatMap(c => CIBLE_TO_ROLES[c] ?? []))];
    return {
      titre: form.titre,
      contenu: form.contenu,
      canal: form.canal,
      cible: isTous ? 'TOUS' : roleCibles[0],
      roles: actualRoles,
      classeId: hasClasse && !roleCibles.length ? form.classeId : undefined,
      classeIds: hasClasse && !roleCibles.length && form.classeId ? [form.classeId] : undefined,
      classeNom: classe?.nom,
      envoiImmediat: form.envoiImmediat,
      dateEnvoi: form.dateEnvoi || undefined,
      brouillon,
      anneeAcademiqueId: anneeActive?.id ?? undefined,
      documents: documents.length ? documents.map(d => ({ base64: d.base64, mimeType: d.mimeType, nom: d.nom })) : undefined,
    };
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.titre.trim()) e.titre = 'Titre requis';
    if (!form.contenu.trim()) e.contenu = 'Contenu requis';
    if (selectedCibles.includes('CLASSE') && selectedCibles.length === 1 && !form.classeId) e.classeId = 'Choisissez une classe';
    if (!form.envoiImmediat && !form.dateEnvoi) e.dateEnvoi = "Date d'envoi requise";
    if (!form.envoiImmediat && form.dateEnvoi && new Date(form.dateEnvoi) <= new Date()) e.dateEnvoi = 'La date planifiée doit être dans le futur';
    return e;
  }

  function resetComposer() {
    setForm({ titre: '', contenu: '', canal: 'NOTIFICATION', classeId: '', dateEnvoi: '', envoiImmediat: true });
    setSelectedCibles(['TOUS']);
    setDocuments([]);
    setDocError('');
    setPreview(null);
    setErrors({});
  }

  function closeModal() {
    setShowModal(false);
    setEditMessage(null);
    resetComposer();
  }

  function openEdit(m: Message) {
    setForm({ titre: m.titre, contenu: m.contenu, canal: m.canal, classeId: m.classeId ?? '', dateEnvoi: '', envoiImmediat: true });
    const knownCibles = CIBLE_OPTIONS.map(o => o.value);
    const cibleVal = m.cible as Cible;
    setSelectedCibles(knownCibles.includes(cibleVal) ? [cibleVal] : ['TOUS']);
    setDocuments([]);
    setDocError('');
    setPreview(null);
    setErrors({});
    setEditMessage(m);
    setDetail(null);
  }

  function handleDelete(m: Message, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDelete(m);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    try {
      await deleteCommunication.mutateAsync(confirmDelete.id);
      if (detail?.id === confirmDelete.id) setDetail(null);
      setConfirmDelete(null);
    } catch { /* toast géré par le hook */ }
  }

  async function refreshPreview() {
    try {
      const result = await previewDestinataires.mutateAsync(buildPayload(false));
      setPreview(normalizePreviewResult(result));
    } catch {
      setPreview(null);
      toast.error('Impossible de calculer les destinataires');
    }
  }

  async function handleEnvoyer(brouillon = false) {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      // Les erreurs inline peuvent être hors écran dans un composeur qui défile :
      // sans ce retour, le clic paraît sans effet et l'utilisateur croit avoir enregistré.
      toast.error(Object.values(e)[0] ?? 'Formulaire incomplet');
      return;
    }
    try {
      if (editMessage) {
        await updateCommunication.mutateAsync({ id: editMessage.id, data: buildPayload(brouillon) });
      } else {
        await createCommunication.mutateAsync(buildPayload(brouillon));
      }
      closeModal();
    } catch {
      toast.error('Opération non réalisée. Vérifiez que le backend est joignable.');
    }
  }

  const stats = {
    total: messages.length,
    envoyes: messages.filter(m => m.statut === 'ENVOYE').length,
    planifies: messages.filter(m => m.statut === 'PLANIFIE').length,
    brouillons: messages.filter(m => m.statut === 'BROUILLON').length,
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Communication</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Notifications · SMS · E-mail · WhatsApp</div>
        </div>
        <button onClick={() => { resetComposer(); setShowModal(true); }} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Nouveau message
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total messages', value: stats.total, color: '#0f172a' },
            { label: 'Envoyés', value: stats.envoyes, color: '#16a34a' },
            { label: 'Planifiés', value: stats.planifies, color: '#d97706' },
            { label: 'Brouillons', value: stats.brouillons, color: '#94a3b8' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Année académique */}
          <select value={filtreAnnee} onChange={e => setFiltreAnnee(e.target.value)} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#334155', outline: 'none' }}>
            <option value="">Toutes les années</option>
            {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.active ? ' ✓' : ''}</option>)}
          </select>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#334155', outline: 'none' }}>
            <option value="TOUS">Tous les statuts</option>
            {(['ENVOYE', 'PLANIFIE', 'BROUILLON', 'ECHEC'] as Statut[]).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          <select value={filtreCanal} onChange={e => setFiltreCanal(e.target.value)} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#334155', outline: 'none' }}>
            <option value="TOUS">Tous les canaux</option>
            {(['NOTIFICATION', 'SMS', 'EMAIL', 'WHATSAPP'] as Canal[]).map(c => <option key={c} value={c}>{CANAL_LABELS[c]}</option>)}
          </select>
          <select value={filtreCible} onChange={e => setFiltreCible(e.target.value)} style={{ border: `1px solid ${BORDER}`, borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#334155', outline: 'none' }}>
            <option value="TOUS">Toutes les cibles</option>
            {CIBLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {filtered.length} message(s)
          </div>
        </div>

        {/* Liste — plus récent en premier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {isLoading ? 'Chargement…' : 'Aucun message trouvé'}
            </div>
          )}
          {filtered.map(m => (
            <div key={m.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(m)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{m.titre}</span>
                    <Badge label={CANAL_LABELS[m.canal]} color={CANAL_COLORS[m.canal]} />
                    <Badge label={STATUT_LABELS[m.statut]} color={STATUT_COLORS[m.statut]} />
                    <Badge label={cibleLabel(m)} color="#475569" />
                    {m.documents.length > 0 && <Badge label={`${m.documents.length} doc${m.documents.length > 1 ? 's' : ''}`} color="#2563eb" />}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.contenu}
                  </div>
                  {/* Documents joints */}
                  {m.documents.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                      {m.documents.map((doc, i) => (
                        <a key={i} href={doc.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>
                          <span>{docIcon(doc.mimeType)}</span>
                          <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</span>
                          {doc.taille && <span style={{ color: '#64748b' }}>· {formatFileSize(doc.taille)}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
                    <span>{m.auteur}</span>
                    {m.dateEnvoi && <span>{m.statut === 'PLANIFIE' ? 'Planifié le ' : 'Envoyé le '}{new Date(m.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                    {!m.dateEnvoi && <span>Créé le {new Date(m.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {m.nbDestinataires > 0 && <span>{m.nbDestinataires} destinataire(s)</span>}
                    {m.nbLus !== undefined && m.nbDestinataires > 0 && <span>{m.nbLus} lu(s) ({Math.round((m.nbLus / m.nbDestinataires) * 100)}%)</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {(m.statut === 'BROUILLON' || m.statut === 'PLANIFIE') && (
                    <button onClick={() => openEdit(m)} style={{ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', borderRadius: 5, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Modifier
                    </button>
                  )}
                  <button onClick={e => void handleDelete(m, e)} disabled={deleteCommunication.isPending} style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 5, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: deleteCommunication.isPending ? 'not-allowed' : 'pointer' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal nouveau message / modifier ──────────────────────────────── */}
      {(showModal || editMessage !== null) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', width: 600, maxHeight: '92vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{editMessage ? 'Modifier le message' : 'Nouveau message'}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Année académique (automatique) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: anneeActive ? '#f0fdf4' : '#fef9c3', border: `1px solid ${anneeActive ? '#bbf7d0' : '#fde68a'}`, borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ fontSize: 13, color: anneeActive ? '#15803d' : '#92400e' }}>
                  Année académique :
                  <b style={{ marginLeft: 4 }}>{anneeActive ? anneeActive.libelle : 'Aucune année active'}</b>
                </span>
                {!anneeActive && <span style={{ fontSize: 11, color: '#92400e' }}>— configurez une année active dans les paramètres</span>}
              </div>

              {/* Canal */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Canal *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['NOTIFICATION', 'SMS', 'EMAIL', 'WHATSAPP'] as Canal[]).map(c => {
                    const disabled = c !== 'NOTIFICATION';
                    return (
                      <button key={c} disabled={disabled} onClick={() => setForm({ ...form, canal: c })} style={{ flex: 1, padding: '8px 4px', border: `1px solid ${form.canal === c ? CANAL_COLORS[c] : BORDER}`, borderRadius: 6, background: form.canal === c ? '#eff6ff' : '#fff', color: disabled ? '#cbd5e1' : form.canal === c ? CANAL_COLORS[c] : '#64748b', fontWeight: 600, fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                        {CANAL_LABELS[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre du message" style={{ width: '100%', border: `1px solid ${errors.titre ? '#dc2626' : BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#0f172a' }} />
                {errors.titre && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.titre}</div>}
              </div>

              {/* Contenu */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Contenu *</label>
                <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} rows={5} placeholder="Rédigez votre message..." style={{ width: '100%', border: `1px solid ${errors.contenu ? '#dc2626' : BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none', color: '#0f172a' }} />
                {errors.contenu && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.contenu}</div>}
              </div>

              {/* ── Documents joints (multi) ─────────────────────────────────── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Documents joints</label>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#2563eb', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    + Ajouter un fichier
                  </button>
                  <input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx" multiple hidden onChange={e => void handleFilesChange(e.target.files)} />
                </div>
                {documents.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', padding: '6px 0' }}>Aucun document joint</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: PANEL_BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 6, padding: '7px 10px' }}>
                      <span style={{ fontSize: 16 }}>{docIcon(doc.mimeType)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{formatFileSize(doc.taille)}</div>
                      </div>
                      <button type="button" onClick={() => removeDocument(i)} style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 5, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Retirer</button>
                    </div>
                  ))}
                </div>
                {docError && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{docError}</div>}
              </div>

              {/* ── Destinataires (multi-select checkboxes) ───────────────────── */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Destinataires *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px', background: PANEL_BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 6, padding: '12px 14px' }}>
                  {CIBLE_OPTIONS.map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#334155', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={selectedCibles.includes(opt.value)}
                        onChange={e => toggleCible(opt.value, e.target.checked)}
                        style={{ accentColor: '#2563eb', width: 14, height: 14, cursor: 'pointer' }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {/* Sélection classe si CLASSE coché */}
                {selectedCibles.includes('CLASSE') && (
                  <div style={{ marginTop: 8 }}>
                    <select value={form.classeId} onChange={e => { setForm({ ...form, classeId: e.target.value }); setPreview(null); }} style={{ width: '100%', border: `1px solid ${errors.classeId ? '#dc2626' : BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#334155', outline: 'none' }}>
                      <option value="">Choisir une classe</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                    {errors.classeId && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.classeId}</div>}
                  </div>
                )}
              </div>

              {/* Envoi */}
              <div style={{ background: PANEL_BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 6, padding: '12px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.envoiImmediat} onChange={e => setForm({ ...form, envoiImmediat: e.target.checked })} />
                  <span>Envoyer immédiatement</span>
                </label>
                {!form.envoiImmediat && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date et heure d&apos;envoi *</label>
                    <input type="datetime-local" value={form.dateEnvoi} onChange={e => setForm({ ...form, dateEnvoi: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.dateEnvoi ? '#dc2626' : BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#334155' }} />
                    {errors.dateEnvoi && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.dateEnvoi}</div>}
                  </div>
                )}
              </div>

              {/* Aperçu destinataires */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', background: '#fff', border: `1px solid ${BORDER_SOFT}`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <b style={{ color: '#0f172a' }}>{preview?.total ?? '—'}</b> destinataire(s)
                  {preview?.parRole && Object.keys(preview.parRole).length > 0 && (
                    <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                      ({Object.entries(preview.parRole).map(([r, n]) => `${r}: ${n}`).join(', ')})
                    </span>
                  )}
                </div>
                <button onClick={() => void refreshPreview()} disabled={previewDestinataires.isPending} style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#2563eb', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: previewDestinataires.isPending ? 'not-allowed' : 'pointer', opacity: previewDestinataires.isPending ? 0.7 : 1 }}>
                  {previewDestinataires.isPending ? 'Calcul…' : 'Aperçu'}
                </button>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: '#fff' }}>
              {!editMessage && (
                <button onClick={() => void handleEnvoyer(true)} disabled={createCommunication.isPending || updateCommunication.isPending} style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Sauvegarder brouillon
                </button>
              )}
              <button onClick={() => void handleEnvoyer(false)} disabled={createCommunication.isPending || updateCommunication.isPending} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: (createCommunication.isPending || updateCommunication.isPending) ? 'not-allowed' : 'pointer', opacity: (createCommunication.isPending || updateCommunication.isPending) ? 0.7 : 1 }}>
                {(createCommunication.isPending || updateCommunication.isPending) ? 'Enregistrement…' : editMessage ? 'Enregistrer les modifications' : form.envoiImmediat ? 'Envoyer maintenant' : "Planifier l'envoi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détail ───────────────────────────────────────────────────── */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', width: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail du message</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={CANAL_LABELS[detail.canal]} color={CANAL_COLORS[detail.canal]} />
                <Badge label={STATUT_LABELS[detail.statut]} color={STATUT_COLORS[detail.statut]} />
                <Badge label={cibleLabel(detail)} color="#475569" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: PANEL_BG, border: `1px solid ${BORDER_SOFT}`, borderRadius: 6, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>{detail.contenu}</div>

              {/* Documents dans le détail */}
              {detail.documents.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Documents joints ({detail.documents.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 12px', textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 16 }}>{docIcon(doc.mimeType)}</span>
                          <span style={{ color: '#1d4ed8', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</span>
                        </div>
                        {doc.taille && <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0 }}>{formatFileSize(doc.taille)}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b' }}>
                <div><b>Auteur :</b> {detail.auteur}</div>
                <div><b>Créé le :</b> {new Date(detail.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                {detail.dateEnvoi && <div><b>{detail.statut === 'PLANIFIE' ? 'Planifié le' : 'Envoyé le'} :</b> {new Date(detail.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                {detail.nbDestinataires > 0 && <div><b>Destinataires :</b> {detail.nbDestinataires}</div>}
                {detail.nbLus !== undefined && detail.nbDestinataires > 0 && <div><b>Lus :</b> {detail.nbLus} ({Math.round((detail.nbLus / detail.nbDestinataires) * 100)}%)</div>}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(detail.statut === 'BROUILLON' || detail.statut === 'PLANIFIE') && (
                <button onClick={() => openEdit(detail)} style={{ border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Modifier</button>
              )}
              <button onClick={e => void handleDelete(detail, e)} disabled={deleteCommunication.isPending} style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: deleteCommunication.isPending ? 'not-allowed' : 'pointer' }}>Supprimer</button>
              <button onClick={() => setDetail(null)} style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ─────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', width: 420, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '20px 24px 16px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Supprimer ce message ?</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                Le message <b style={{ color: '#0f172a' }}>&ldquo;{confirmDelete.titre}&rdquo;</b> sera définitivement supprimé. Cette action est irréversible.
              </div>
            </div>
            <div style={{ padding: '12px 24px 20px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleteCommunication.isPending} style={{ border: `1px solid ${BORDER}`, background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => void handleConfirmDelete()} disabled={deleteCommunication.isPending} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: deleteCommunication.isPending ? 'not-allowed' : 'pointer', opacity: deleteCommunication.isPending ? 0.7 : 1 }}>
                {deleteCommunication.isPending ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
