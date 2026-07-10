'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

type Tab = 'identite' | 'apparence' | 'cycles' | 'annees' | 'batiments' | 'whatsapp' | 'coefficients';

const TABS: { key: Tab; label: string }[] = [
  { key: 'identite', label: 'Identité école' },
  { key: 'apparence', label: 'Apparence' },
  { key: 'cycles', label: 'Cycles & Niveaux' },
  { key: 'annees', label: 'Années académiques' },
  { key: 'batiments', label: 'Bâtiments & Salles' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'coefficients', label: 'Coefficients' },
];

const PAYS_LIST = [
  // Zone FCFA (XOF)
  { code: 'SN', label: 'Sénégal',         indicatif: '+221', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'ML', label: 'Mali',             indicatif: '+223', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'GW', label: 'Guinée-Bissau',   indicatif: '+245', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'CI', label: 'Côte d\'Ivoire',  indicatif: '+225', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'BF', label: 'Burkina Faso',    indicatif: '+226', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'NE', label: 'Niger',           indicatif: '+227', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'TG', label: 'Togo',            indicatif: '+228', devise: 'FCFA', symbole: 'F CFA' },
  { code: 'BJ', label: 'Bénin',           indicatif: '+229', devise: 'FCFA', symbole: 'F CFA' },
  // Mauritanie
  { code: 'MR', label: 'Mauritanie',      indicatif: '+222', devise: 'MRU',  symbole: 'MRU'   },
  // Guinée Conakry
  { code: 'GN', label: 'Guinée Conakry',  indicatif: '+224', devise: 'GNF',  symbole: 'GNF'   },
  // Gambie
  { code: 'GM', label: 'Gambie',          indicatif: '+220', devise: 'GMD',  symbole: 'GMD'   },
  // Sierra Leone
  { code: 'SL', label: 'Sierra Leone',    indicatif: '+232', devise: 'SLE',  symbole: 'SLE'   },
  // Ghana
  { code: 'GH', label: 'Ghana',           indicatif: '+233', devise: 'GHS',  symbole: 'GH₵'   },
  // Nigéria
  { code: 'NG', label: 'Nigéria',         indicatif: '+234', devise: 'NGN',  symbole: '₦'     },
  // Cap-Vert
  { code: 'CV', label: 'Cap-Vert',        indicatif: '+238', devise: 'CVE',  symbole: 'CVE'   },
  // Libéria
  { code: 'LR', label: 'Libéria',         indicatif: '+231', devise: 'LRD',  symbole: 'LRD'   },
];

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

const PALETTE_COLORS = [
  { key: 'blue', label: 'Bleu', primary: '#03a9f3', bg: '#2f7d6f' },
  { key: 'white', label: 'Bleu clair', primary: '#2563eb', bg: '#eff6ff' },
  { key: 'indigo', label: 'Indigo', primary: '#4f46e5', bg: '#3730a3' },
  { key: 'purple', label: 'Violet', primary: '#6777ef', bg: '#4c1d95' },
  { key: 'teal', label: 'Sarcelle', primary: '#0f766e', bg: '#115e59' },
  { key: 'green', label: 'Vert', primary: '#16a34a', bg: '#166534' },
  { key: 'cyan', label: 'Cyan', primary: '#0891b2', bg: '#155e75' },
  { key: 'orange', label: 'Orange', primary: '#f97316', bg: '#9a3412' },
  { key: 'red', label: 'Rouge', primary: '#dc2626', bg: '#7f1d1d' },
  { key: 'pink', label: 'Rose', primary: '#db2777', bg: '#831843' },
  { key: 'amber', label: 'Ambre', primary: '#d97706', bg: '#92400e' },
  { key: 'slate', label: 'Ardoise', primary: '#475569', bg: '#334155' },
  { key: 'black', label: 'Noir', primary: '#1f2937', bg: '#111827' },
];

type CycleItem = { id: string; nom: string; actif: boolean; typePeriode?: string; moyenneMaximale?: number; seeded?: boolean };
type FraisItem = { sectionId?: string; section: string; niveau: string; inscription: number; mensualite: number; nbMois: number; actif: boolean };

type CoefNiveau = { id: string; nom: string };
type CoefMatiere = { id: string; libelle: string };
type CoefRow = { id: string; niveauId?: string; matiere?: { libelle?: string }; niveau?: { id?: string; libelle?: string; nom?: string }; coefficient?: number };

function getDevise(paysCode: string): string {
  return PAYS_LIST.find((p) => p.code === paysCode)?.symbole ?? 'MRU';
}

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}
function fieldWrap(mb = 14): React.CSSProperties {
  return { marginBottom: mb };
}

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('identite');

  // ── Identité ─────────────────────────────────────────────────────────
  const [ecoleForm, setEcoleForm] = useState({
    nom: '', slogan: '', adresse: '', ville: '', pays: 'SN',
    telephone: '', email: '', siteWeb: '', numeroAgrement: '', logoUrl: '',
  });
  const [loadingEcole, setLoadingEcole] = useState(true);
  const [savingEcole, setSavingEcole] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/admin/configuration/ecole')
      .then((res) => {
        const d = res.data;
        setEcoleForm((f) => ({
          ...f,
          nom: d.nom ?? '',
          slogan: d.slogan ?? '',
          adresse: d.adresse ?? '',
          ville: d.ville ?? '',
          pays: d.pays ?? 'SN',
          telephone: d.telephone ?? '',
          email: d.email ?? '',
          siteWeb: d.siteWeb ?? '',
          numeroAgrement: d.numeroAgrement ?? '',
          logoUrl: d.logoUrl ?? '',
        }));
        try { if (d.pays) localStorage.setItem('medaaris_pays', d.pays); } catch { /* ignore */ }
      })
      .catch(() => { /* laisse le formulaire vide */ })
      .finally(() => setLoadingEcole(false));
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo trop lourd (max 2 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setEcoleForm((f) => ({ ...f, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEcole = async () => {
    if (!ecoleForm.nom || !ecoleForm.email || !ecoleForm.adresse || !ecoleForm.ville || !ecoleForm.telephone) {
      toast.error('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }
    setSavingEcole(true);
    try {
      const { logoUrl, ...rest } = ecoleForm;
      const payload = logoUrl ? { ...rest, logoUrl } : rest;
      const res = await apiClient.put('/admin/configuration/ecole', payload);
      try { localStorage.setItem('medaaris_pays', ecoleForm.pays); } catch { /* ignore */ }
      // Notifier la sidebar pour mise à jour immédiate
      try {
        window.dispatchEvent(new CustomEvent('ecole-config-updated', {
          detail: { nom: res.data?.nom ?? ecoleForm.nom, logoUrl: res.data?.logoUrl ?? ecoleForm.logoUrl },
        }));
      } catch { /* ignore */ }
      toast.success('Informations enregistrées');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingEcole(false);
    }
  };

  // ── Apparence ────────────────────────────────────────────────────────
  const [activePalette, setActivePalette] = useState('blue');
  const [darkSidebar, setDarkSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loadingApparence, setLoadingApparence] = useState(true);
  const [savingApparence, setSavingApparence] = useState(false);

  useEffect(() => {
    apiClient.get('/admin/configuration/apparence')
      .then((res) => {
        const d = res.data;
        if (d.themeColor) setActivePalette(d.themeColor);
        setDarkSidebar(d.sidebarMode === 'dark');
        setDarkMode(d.displayMode === 'dark');
      })
      .catch(() => {})
      .finally(() => setLoadingApparence(false));
  }, []);

  const handleSaveApparence = async (reset = false) => {
    setSavingApparence(true);
    try {
      const palette = PALETTE_COLORS.find((p) => p.key === activePalette);
      await apiClient.put('/admin/configuration/apparence', {
        themeColor: activePalette,
        sidebarMode: darkSidebar ? 'dark' : 'light',
        displayMode: darkMode ? 'dark' : 'light',
        ...(palette ? { primaryColor: palette.primary, backgroundColor: palette.bg } : {}),
        reset,
      });
      toast.success(reset ? 'Apparence réinitialisée' : 'Apparence enregistrée');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erreur lors de l'enregistrement");
    } finally {
      setSavingApparence(false);
    }
  };

  const handleResetApparence = async () => {
    setActivePalette('blue');
    setDarkSidebar(false);
    setDarkMode(false);
    await handleSaveApparence(true);
  };

  // ── Cycles & Frais & Niveaux ─────────────────────────────────────────
  type NiveauConfigItem = { id: string; nom: string; section: string; moyennePassage: number; actif: boolean };
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [fraisList, setFraisList] = useState<FraisItem[]>([]);
  const [niveauxConfig, setNiveauxConfig] = useState<NiveauConfigItem[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editCycleId, setEditCycleId] = useState<string | null>(null);
  const [cycleForm, setCycleForm] = useState({ nom: '', typePeriode: 'TRIMESTRE' });
  const [showNiveauModal, setShowNiveauModal] = useState(false);
  const [niveauForm, setNiveauForm] = useState({ sectionId: '', niveau: '', inscription: '', mensualite: '', nbMois: '9' });
  const [savingFrais, setSavingFrais] = useState(false);
  const [editMoyennes, setEditMoyennes] = useState<Record<string, string>>({});
  const [savingMoyenne, setSavingMoyenne] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/configuration/sections'),
      apiClient.get('/admin/configuration/frais'),
      apiClient.get('/admin/configuration/niveaux'),
    ])
      .then(([secRes, fraisRes, nvRes]) => {
        setCycles(secRes.data ?? []);
        setFraisList(fraisRes.data ?? []);
        const d = nvRes.data as Record<string, unknown>;
        setNiveauxConfig((Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])) as NiveauConfigItem[]);
      })
      .catch(() => {})
      .finally(() => setLoadingCycles(false));
  }, []);

  const getMoyenne = (id: string, def: number) =>
    editMoyennes[id] !== undefined ? editMoyennes[id] : String(def ?? 10);

  const handleSaveMoyenne = async (id: string) => {
    const val = parseFloat(getMoyenne(id, 10));
    if (isNaN(val) || val < 0 || val > 20) { toast.error('Moyenne de passage entre 0 et 20'); return; }
    setSavingMoyenne(id);
    try {
      await apiClient.patch(`/admin/configuration/niveaux/${id}`, { moyennePassage: val });
      setNiveauxConfig((prev) => prev.map((n) => n.id === id ? { ...n, moyennePassage: val } : n));
      setEditMoyennes((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success('Moyenne de passage mise à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSavingMoyenne(null);
    }
  };

  const handleSaveFrais = async () => {
    setSavingFrais(true);
    try {
      const res = await apiClient.put('/admin/configuration/frais', {
        frais: fraisList.map((f) => ({
          section: f.section,
          niveau: f.niveau,
          inscription: f.inscription,
          mensualite: f.mensualite,
          nbMois: f.nbMois,
          actif: f.actif,
        })),
      });
      setFraisList(res.data ?? []);
      toast.success('Frais enregistrés');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Erreur lors de l'enregistrement");
    } finally {
      setSavingFrais(false);
    }
  };

  const handleToggleCycle = async (s: CycleItem) => {
    try {
      await apiClient.patch(`/admin/configuration/sections/${s.id}`, { actif: !s.actif });
      setCycles((prev) => prev.map((x) => x.id === s.id ? { ...x, actif: !x.actif } : x));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    }
  };

  const handleSaveCycle = async () => {
    if (!cycleForm.nom.trim()) return;
    try {
      if (editCycleId) {
        await apiClient.patch(`/admin/configuration/sections/${editCycleId}`, { nom: cycleForm.nom.trim(), typePeriode: cycleForm.typePeriode });
        setCycles((prev) => prev.map((c) => c.id === editCycleId ? { ...c, nom: cycleForm.nom.trim(), typePeriode: cycleForm.typePeriode } : c));
        toast.success('Cycle modifié');
      } else {
        const res = await apiClient.post('/admin/configuration/sections', { nom: cycleForm.nom.trim(), typePeriode: cycleForm.typePeriode });
        setCycles((prev) => [...prev, res.data]);
        toast.success('Cycle ajouté');
      }
      setCycleForm({ nom: '', typePeriode: 'TRIMESTRE' });
      setEditCycleId(null);
      setShowCycleModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    }
  };

  const handleAddNiveau = async () => {
    if (!niveauForm.sectionId || !niveauForm.niveau) { toast.error('Cycle et niveau obligatoires'); return; }
    try {
      await apiClient.post('/admin/configuration/niveaux', {
        sectionId: niveauForm.sectionId,
        nom: niveauForm.niveau,
      });
      const fraisRes = await apiClient.get('/admin/configuration/frais');
      setFraisList(fraisRes.data ?? []);
      setNiveauForm({ sectionId: '', niveau: '', inscription: '', mensualite: '', nbMois: '9' });
      setShowNiveauModal(false);
      toast.success('Niveau ajouté');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    }
  };

  // ── Années académiques ───────────────────────────────────────────────
  type AnneeItem = { id: string; libelle: string; dateDebut?: string | null; dateFin?: string | null; estCourante?: boolean; active?: boolean; statut?: string };
  const [annees, setAnnees] = useState<AnneeItem[]>([]);
  const [loadingAnnees, setLoadingAnnees] = useState(false);
  const [anneeForm, setAnneeForm] = useState({ libelle: '', dateDebut: '', dateFin: '' });
  const [editAnnees, setEditAnnees] = useState<Record<string, { libelle: string; dateDebut: string; dateFin: string }>>({});
  const [savingAnnee, setSavingAnnee] = useState(false);
  const [savingAnneeId, setSavingAnneeId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'annees') return;
    setLoadingAnnees(true);
    apiClient.get('/admin/configuration/annees-academiques')
      .then((res) => {
        const d = res.data;
        const list: AnneeItem[] = Array.isArray(d) ? d : (d?.data ?? d?.content ?? []);
        setAnnees([...list].sort((a, b) => b.libelle.localeCompare(a.libelle)));
        setEditAnnees(Object.fromEntries(list.map((a) => [a.id, { libelle: a.libelle, dateDebut: toDateInput(a.dateDebut), dateFin: toDateInput(a.dateFin) }])));
      })
      .catch(() => {})
      .finally(() => setLoadingAnnees(false));
  }, [activeTab]);

  const handleCreateAnnee = async () => {
    if (!anneeForm.libelle.trim()) { toast.error('Libellé requis'); return; }
    setSavingAnnee(true);
    try {
      const payload = {
        libelle: anneeForm.libelle.trim(),
        dateDebut: anneeForm.dateDebut || undefined,
        dateFin: anneeForm.dateFin || undefined,
        active: false,
      };
      const res = await apiClient.post('/admin/configuration/annees-academiques', payload);
      const created = res.data as AnneeItem;
      setAnnees((prev) => [...prev, created].sort((a, b) => b.libelle.localeCompare(a.libelle)));
      setEditAnnees((prev) => ({ ...prev, [created.id]: { libelle: created.libelle, dateDebut: toDateInput(created.dateDebut), dateFin: toDateInput(created.dateFin) } }));
      setAnneeForm({ libelle: '', dateDebut: '', dateFin: '' });
      toast.success('Année académique créée');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur lors de la création');
    } finally {
      setSavingAnnee(false);
    }
  };

  const handleActiverAnnee = async (id: string) => {
    setSavingAnneeId(id);
    try {
      const res = await apiClient.patch(`/admin/configuration/annees-academiques/${id}/activer`, {});
      const updated = res.data as AnneeItem;
      setAnnees((prev) => prev.map((a) => a.id === id ? updated : { ...a, estCourante: false, active: false, statut: 'CLOTUREE' }));
      setEditAnnees((prev) => ({ ...prev, [id]: { libelle: updated.libelle, dateDebut: toDateInput(updated.dateDebut), dateFin: toDateInput(updated.dateFin) } }));
      toast.success('Année académique débutée');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    } finally {
      setSavingAnneeId(null);
    }
  };

  const handleFinirAnnee = async (id: string) => {
    setSavingAnneeId(id);
    try {
      const res = await apiClient.patch(`/admin/configuration/annees-academiques/${id}/finir`, {});
      const updated = res.data as AnneeItem;
      setAnnees((prev) => prev.map((a) => a.id === id ? updated : a));
      setEditAnnees((prev) => ({ ...prev, [id]: { libelle: updated.libelle, dateDebut: toDateInput(updated.dateDebut), dateFin: toDateInput(updated.dateFin) } }));
      toast.success('Année académique terminée');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    } finally {
      setSavingAnneeId(null);
    }
  };

  const handleSaveAnnee = async (id: string) => {
    const edit = editAnnees[id];
    if (!edit?.libelle.trim()) { toast.error('Libellé requis'); return; }
    setSavingAnneeId(id);
    try {
      const res = await apiClient.patch(`/admin/configuration/annees-academiques/${id}`, {
        libelle: edit.libelle.trim(),
        dateDebut: edit.dateDebut || undefined,
        dateFin: edit.dateFin || null,
      });
      const updated = res.data as AnneeItem;
      setAnnees((prev) => prev.map((a) => a.id === id ? updated : a).sort((a, b) => b.libelle.localeCompare(a.libelle)));
      setEditAnnees((prev) => ({ ...prev, [id]: { libelle: updated.libelle, dateDebut: toDateInput(updated.dateDebut), dateFin: toDateInput(updated.dateFin) } }));
      toast.success('Année académique mise à jour');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Erreur');
    } finally {
      setSavingAnneeId(null);
    }
  };

  // ── WhatsApp ─────────────────────────────────────────────────────────
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [waFeatures, setWaFeatures] = useState({
    envoisAutomatiques: true,
    notifBulletins: true,
    notifPaiements: true,
    notifAbsences: false,
    notifAnnonces: true,
  });

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    setQrVisible(false);
    await new Promise((r) => setTimeout(r, 1200));
    setLoadingQr(false);
    setQrVisible(true);
    setQrCountdown(45);
    const interval = setInterval(() => {
      setQrCountdown((c) => {
        if (c <= 1) { clearInterval(interval); setQrVisible(false); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleDisconnectWa = () => {
    setWaConnected(false);
    setWaPhone('');
    setQrVisible(false);
    toast.success('WhatsApp déconnecté');
  };

  const handleTestWa = async () => {
    toast.success('Message de test envoyé !');
  };

  // ── Bâtiments & Salles ──────────────────────────────────────────────
  type BatimentItem = { id: string; nom: string; description?: string; actif: boolean };
  type SalleItem2 = { id: string; nom: string; batimentId: string; capacite?: number; typeSalle?: string; actif: boolean };
  const [batiments, setBatiments] = useState<BatimentItem[]>([]);
  const [batSalles, setBatSalles] = useState<SalleItem2[]>([]);
  const [batLoading, setBatLoading] = useState(true);
  const [showBatModal, setShowBatModal] = useState(false);
  const [editBatId, setEditBatId] = useState<string | null>(null);
  const [batForm, setBatForm] = useState({ nom: '', description: '' });
  const [showSalleModal, setShowSalleModal] = useState(false);
  const [editSalleId, setEditSalleId] = useState<string | null>(null);
  const [salleForm, setSalleForm] = useState({ batimentId: '', nom: '', capacite: '', typeSalle: '' });
  const [batSaving, setBatSaving] = useState(false);

  useEffect(() => {
    if (activeTab !== 'batiments') return;
    setBatLoading(true);
    Promise.all([
      apiClient.get('/admin/batiments', { params: { size: 500 } }),
      apiClient.get('/admin/salles', { params: { size: 500 } }),
    ]).then(([batR, salR]) => {
      const ext = (r: { data: unknown }) => { const d = r.data as Record<string, unknown>; return Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as Record<string, unknown>[]); };
      setBatiments(ext(batR) as BatimentItem[]);
      setBatSalles(ext(salR) as SalleItem2[]);
    }).catch(() => {}).finally(() => setBatLoading(false));
  }, [activeTab]);

  const handleSaveBat = async () => {
    if (!batForm.nom.trim()) { toast.error('Nom obligatoire'); return; }
    setBatSaving(true);
    try {
      if (editBatId) {
        await apiClient.put(`/admin/batiments/${editBatId}`, { nom: batForm.nom.trim(), description: batForm.description || undefined });
        setBatiments((prev) => prev.map((b) => b.id === editBatId ? { ...b, nom: batForm.nom.trim(), description: batForm.description } : b));
      } else {
        const res = await apiClient.post('/admin/batiments', { nom: batForm.nom.trim(), description: batForm.description || undefined });
        const d = (res.data?.data ?? res.data) as BatimentItem;
        setBatiments((prev) => [...prev, d]);
      }
      setShowBatModal(false);
      toast.success(editBatId ? 'Bâtiment modifié' : 'Bâtiment ajouté');
    } catch { toast.error('Erreur'); }
    finally { setBatSaving(false); }
  };

  const handleSaveSalle = async () => {
    if (!salleForm.batimentId || !salleForm.nom.trim()) { toast.error('Bâtiment et nom obligatoires'); return; }
    setBatSaving(true);
    try {
      const payload = { batimentId: salleForm.batimentId, nom: salleForm.nom.trim(), capacite: Number(salleForm.capacite) || undefined, typeSalle: salleForm.typeSalle || undefined };
      if (editSalleId) {
        await apiClient.put(`/admin/salles/${editSalleId}`, payload);
        setBatSalles((prev) => prev.map((s) => s.id === editSalleId ? { ...s, ...payload, capacite: Number(salleForm.capacite) || undefined, actif: s.actif } as SalleItem2 : s));
      } else {
        const res = await apiClient.post('/admin/salles', payload);
        const d = (res.data?.data ?? res.data) as SalleItem2;
        setBatSalles((prev) => [...prev, d]);
      }
      setShowSalleModal(false);
      toast.success(editSalleId ? 'Salle modifiée' : 'Salle ajoutée');
    } catch { toast.error('Erreur'); }
    finally { setBatSaving(false); }
  };

  const handleDeleteSalle = async (id: string) => {
    if (!confirm('Supprimer cette salle ?')) return;
    try { await apiClient.delete(`/admin/salles/${id}`); setBatSalles((prev) => prev.filter((s) => s.id !== id)); toast.success('Salle supprimée'); }
    catch { toast.error('Erreur (salle peut-être utilisée)'); }
  };

  // ── Coefficients ─────────────────────────────────────────────────────
  const [selectedNiveauId, setSelectedNiveauId] = useState('');
  const [coefNiveaux, setCoefNiveaux] = useState<CoefNiveau[]>([]);
  const [coefMatieres, setCoefMatieres] = useState<CoefMatiere[]>([]);
  const [coefRows, setCoefRows] = useState<CoefRow[]>([]);
  const [loadingCoefRows, setLoadingCoefRows] = useState(false);
  const [assignForm, setAssignForm] = useState({ matiereId: '', coefficient: '1', volumeHoraire: '1' });
  const [savingAssign, setSavingAssign] = useState(false);
  const [editCoefs, setEditCoefs] = useState<Record<string, number>>({});

  const getEditCoef = (id: string, defaultVal: number) => editCoefs[id] ?? defaultVal;

  useEffect(() => {
    if (activeTab !== 'coefficients') return;
    const extract = (res: { data: unknown }) => {
      const d = res.data as Record<string, unknown>;
      return Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as unknown[]);
    };
    setLoadingCoefRows(true);
    Promise.all([
      apiClient.get('/admin/configuration/niveaux'),
      apiClient.get('/admin/matieres'),
      apiClient.get('/admin/matieres-niveaux', { params: { size: 2000 } }),
    ]).then(([nr, mr, mnr]) => {
      setCoefNiveaux(extract(nr) as CoefNiveau[]);
      setCoefMatieres(extract(mr) as CoefMatiere[]);
      setCoefRows(extract(mnr) as CoefRow[]);
    }).catch(() => {}).finally(() => setLoadingCoefRows(false));
  }, [activeTab]);

  const refreshCoefRows = async () => {
    const res = await apiClient.get('/admin/matieres-niveaux', { params: { size: 2000 } });
    const d = res.data as Record<string, unknown>;
    setCoefRows((Array.isArray(d) ? d : (d?.data ?? d?.content ?? [])) as CoefRow[]);
  };

  const handleAssign = async () => {
    if (!selectedNiveauId || !assignForm.matiereId) {
      toast.error('Niveau et matière requis');
      return;
    }
    setSavingAssign(true);
    try {
      await apiClient.post('/admin/matieres-niveaux', {
        niveauId: selectedNiveauId,
        matiereId: assignForm.matiereId,
        coefficient: Number(assignForm.coefficient) || 1,
      });
      toast.success('Matière assignée au niveau');
      setAssignForm({ matiereId: '', coefficient: '1', volumeHoraire: '1' });
      await refreshCoefRows();
    } catch {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleSaveCoef = async (id: string, newCoef: number) => {
    try {
      await apiClient.put(`/admin/matieres-niveaux/${id}`, { coefficient: newCoef });
      setCoefRows((prev) => prev.map((r) => r.id === id ? { ...r, coefficient: newCoef } : r));
      toast.success('Coefficient mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Configuration</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Paramètres avancés de l&apos;établissement</div>
        </div>
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #e6ebf1' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                height: 42, padding: '0 18px', border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400,
                color: activeTab === t.key ? '#2563eb' : '#64748b',
                borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>

        {/* ── IDENTITÉ ─────────────────────────────────────────────── */}
        {activeTab === 'identite' && (
          <div style={{ maxWidth: 680 }}>
            {loadingEcole && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>Chargement…</div>
            )}
            {!loadingEcole && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 28, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e6ebf1' }}>
                Informations de l&apos;établissement
              </div>

              {/* Logo */}
              <div style={{ marginBottom: 20 }}>
                <label style={lbl()}>Logo de l&apos;école</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 80, height: 80, border: '1px solid #d9e0e8', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {ecoleForm.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ecoleForm.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    )}
                  </div>
                  <div>
                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleLogoChange} style={{ display: 'none' }} />
                    <button onClick={() => logoInputRef.current?.click()} style={{ height: 34, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 6, display: 'block' }}>
                      Choisir une image
                    </button>
                    {ecoleForm.logoUrl && (
                      <button onClick={() => setEcoleForm((f) => ({ ...f, logoUrl: '' }))} style={{ height: 28, padding: '0 12px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        Supprimer
                      </button>
                    )}
                    <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>PNG, JPEG, WEBP, SVG — max 2 Mo</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ ...fieldWrap(), gridColumn: '1 / -1' }}>
                  <label style={lbl()}>Nom de l&apos;école *</label>
                  <input value={ecoleForm.nom} onChange={(e) => setEcoleForm((f) => ({ ...f, nom: e.target.value }))} style={inp()} placeholder="Ex: École Medaaris" />
                </div>
                <div style={{ ...fieldWrap(), gridColumn: '1 / -1' }}>
                  <label style={lbl()}>Slogan</label>
                  <input value={ecoleForm.slogan} onChange={(e) => setEcoleForm((f) => ({ ...f, slogan: e.target.value }))} style={inp()} placeholder="Slogan ou devise de l'école" />
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>Email *</label>
                  <input type="email" value={ecoleForm.email} onChange={(e) => setEcoleForm((f) => ({ ...f, email: e.target.value }))} style={inp()} placeholder="contact@ecole.mr" />
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>Site web</label>
                  <input value={ecoleForm.siteWeb} onChange={(e) => setEcoleForm((f) => ({ ...f, siteWeb: e.target.value }))} style={inp()} placeholder="https://www.ecole.mr" />
                </div>
                <div style={{ ...fieldWrap(), gridColumn: '1 / -1' }}>
                  <label style={lbl()}>Adresse *</label>
                  <input value={ecoleForm.adresse} onChange={(e) => setEcoleForm((f) => ({ ...f, adresse: e.target.value }))} style={inp()} placeholder="Rue, Quartier…" />
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>Ville *</label>
                  <input value={ecoleForm.ville} onChange={(e) => setEcoleForm((f) => ({ ...f, ville: e.target.value }))} style={inp()} placeholder="Nouakchott" />
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>Pays *</label>
                  <select value={ecoleForm.pays} onChange={(e) => setEcoleForm((f) => ({ ...f, pays: e.target.value }))} style={{ ...inp() }}>
                    {PAYS_LIST.map((p) => <option key={p.code} value={p.code}>{p.label} ({p.indicatif})</option>)}
                  </select>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Devise utilisée :</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 10px', borderRadius: 4 }}>
                      {getDevise(ecoleForm.pays)} — {PAYS_LIST.find((p) => p.code === ecoleForm.pays)?.devise ?? ''}
                    </span>
                  </div>
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>Téléphone *</label>
                  <input value={ecoleForm.telephone} onChange={(e) => setEcoleForm((f) => ({ ...f, telephone: e.target.value }))} style={inp()} placeholder="222 12 34 56 78" />
                </div>
                <div style={fieldWrap()}>
                  <label style={lbl()}>N° Agrément</label>
                  <input value={ecoleForm.numeroAgrement} onChange={(e) => setEcoleForm((f) => ({ ...f, numeroAgrement: e.target.value }))} style={inp()} placeholder="AGR-2024-001" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={handleSaveEcole} disabled={savingEcole} style={{ height: 38, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingEcole ? 0.7 : 1 }}>
                  {savingEcole ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── APPARENCE ─────────────────────────────────────────────── */}
        {activeTab === 'apparence' && (
          <div style={{ maxWidth: 700 }}>
            {loadingApparence && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>Chargement…</div>
            )}
            {!loadingApparence && <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 28, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e6ebf1' }}>
                Palette de couleurs
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {PALETTE_COLORS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActivePalette(p.key)}
                    title={p.label}
                    style={{
                      width: 48, height: 48, border: activePalette === p.key ? `3px solid #0f172a` : '2px solid transparent',
                      background: p.primary, cursor: 'pointer', position: 'relative',
                      outline: activePalette === p.key ? '2px solid #fff' : 'none',
                      outlineOffset: '-4px',
                    }}
                  >
                    {activePalette === p.key && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Mode d&apos;affichage</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setDarkSidebar(false)} style={{ flex: 1, height: 60, border: `2px solid ${!darkSidebar ? '#2563eb' : '#d9e0e8'}`, background: !darkSidebar ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 16, background: '#e8eef6', border: '1px solid #c5d0db' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: !darkSidebar ? '#2563eb' : '#64748b' }}>Sidebar claire</span>
                </button>
                <button onClick={() => setDarkSidebar(true)} style={{ flex: 1, height: 60, border: `2px solid ${darkSidebar ? '#2563eb' : '#d9e0e8'}`, background: darkSidebar ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 16, background: '#1e293b', border: '1px solid #0f172a' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: darkSidebar ? '#2563eb' : '#64748b' }}>Sidebar sombre</span>
                </button>
                <button onClick={() => setDarkMode(false)} style={{ flex: 1, height: 60, border: `2px solid ${!darkMode ? '#2563eb' : '#d9e0e8'}`, background: !darkMode ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 16, background: '#fff', border: '1px solid #e2e8f0' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: !darkMode ? '#2563eb' : '#64748b' }}>Mode clair</span>
                </button>
                <button onClick={() => setDarkMode(true)} style={{ flex: 1, height: 60, border: `2px solid ${darkMode ? '#2563eb' : '#d9e0e8'}`, background: darkMode ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 16, background: '#111827', border: '1px solid #374151' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: darkMode ? '#2563eb' : '#64748b' }}>Mode sombre</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={handleResetApparence} disabled={savingApparence} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: savingApparence ? 0.7 : 1 }}>
                  Réinitialiser
                </button>
                <button onClick={() => handleSaveApparence()} disabled={savingApparence} style={{ height: 38, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingApparence ? 0.7 : 1 }}>
                  {savingApparence ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>}
          </div>
        )}

        {/* ── NIVEAUX ──────────────────────────────────────────────── */}
        {activeTab === 'cycles' && (
          <div>
            {loadingCycles && <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 13 }}>Chargement…</div>}
            {!loadingCycles && <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              {/* Cycles list */}
              <div style={{ width: 320, flexShrink: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Cycles</span>
                    <button onClick={() => { setCycleForm({ nom: '', typePeriode: 'TRIMESTRE' }); setEditCycleId(null); setShowCycleModal(true); }} style={{ height: 30, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      + Ajouter
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cycles.map((s) => (
                      <div key={s.id} style={{ padding: '12px 14px', background: s.actif ? '#f8fafc' : '#f1f5f9', border: '1px solid #e6ebf1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {s.seeded && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.nom}</span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s.actif ? '#16a34a' : '#dc2626', background: s.actif ? '#dcfce7' : '#fee2e2', padding: '2px 6px' }}>{s.actif ? 'Actif' : 'Inactif'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#eff6ff', padding: '2px 8px' }}>
                            {s.typePeriode === 'SEMESTRE' ? 'Semestres' : 'Trimestres'}
                          </span>
                          <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, background: '#f5f3ff', padding: '2px 8px' }}>
                            Moyenne /{s.moyenneMaximale ?? 20}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {!s.seeded && (
                            <>
                              <button onClick={() => { setEditCycleId(s.id); setCycleForm({ nom: s.nom, typePeriode: s.typePeriode ?? 'TRIMESTRE' }); setShowCycleModal(true); }} style={{ fontSize: 11, color: '#2563eb', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                                Modifier
                              </button>
                              <span style={{ color: '#e2e8f0' }}>|</span>
                            </>
                          )}
                          <button onClick={() => handleToggleCycle(s)} style={{ fontSize: 11, color: s.actif ? '#dc2626' : '#16a34a', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                            {s.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frais table */}
              <div style={{ flex: 1 }}>
                <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Frais par niveau</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowNiveauModal(true)} style={{ height: 30, padding: '0 12px', border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        + Niveau
                      </button>
                      <button onClick={handleSaveFrais} disabled={savingFrais} style={{ height: 30, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: savingFrais ? 0.7 : 1 }}>
                        {savingFrais ? 'Enreg…' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 130px 130px 80px 100px', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                      {['Cycle', 'Niveau', 'Inscription', 'Mensualité', 'Nb Mois', 'Total/an'].map((h) => (
                        <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                      ))}
                    </div>
                    {fraisList.map((f, idx) => {
                      const key = `${f.section}::${f.niveau}`;
                      return (
                      <div key={key} style={{ display: 'grid', gridTemplateColumns: '120px 120px 130px 130px 80px 100px', padding: '11px 14px', borderBottom: idx < fraisList.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{f.section}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{f.niveau}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            value={f.inscription}
                            onChange={(e) => setFraisList((prev) => prev.map((x) => `${x.section}::${x.niveau}` === key ? { ...x, inscription: Number(e.target.value) } : x))}
                            onFocus={(e) => e.target.select()}
                            style={{ width: 90, height: 30, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={f.mensualite}
                            onChange={(e) => setFraisList((prev) => prev.map((x) => `${x.section}::${x.niveau}` === key ? { ...x, mensualite: Number(e.target.value) } : x))}
                            onFocus={(e) => e.target.select()}
                            style={{ width: 90, height: 30, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={f.nbMois}
                            onChange={(e) => setFraisList((prev) => prev.map((x) => `${x.section}::${x.niveau}` === key ? { ...x, nbMois: Number(e.target.value) } : x))}
                            style={{ width: 55, height: 30, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                            min={1} max={12}
                          />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{(f.inscription + f.mensualite * f.nbMois).toLocaleString()} {getDevise(ecoleForm.pays)}</span>
                      </div>
                      );
                    })}
                    {fraisList.length === 0 && (
                      <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun niveau configuré</div>
                    )}
                  </div>
                </div>
              </div>
            </div>}

            {/* Niveaux — moyenne de passage */}
            {!loadingCycles && (
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', marginTop: 20 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6ebf1', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  Moyenne de passage par niveau
                </div>
                {niveauxConfig.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun niveau configuré</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 90px', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                      {['Niveau', 'Cycle', 'Moy. passage (0–20)', 'Action'].map((h) => (
                        <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                      ))}
                    </div>
                    {niveauxConfig.map((n, idx) => (
                      <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 90px', padding: '11px 20px', borderBottom: idx < niveauxConfig.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{n.nom}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{n.section}</span>
                        <input
                          type="number"
                          value={getMoyenne(n.id, n.moyennePassage)}
                          onChange={(e) => setEditMoyennes((prev) => ({ ...prev, [n.id]: e.target.value }))}
                          min={0} max={20} step={0.5}
                          style={{ width: 100, height: 30, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                        />
                        <button
                          onClick={() => handleSaveMoyenne(n.id)}
                          disabled={savingMoyenne === n.id}
                          style={{ height: 28, padding: '0 12px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingMoyenne === n.id ? 0.6 : 1 }}
                        >
                          {savingMoyenne === n.id ? '…' : 'Enregistrer'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ANNÉES ACADÉMIQUES ───────────────────────────────────── */}
        {activeTab === 'annees' && (
          <div style={{ maxWidth: 980 }}>
            {/* Formulaire ajout */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e6ebf1' }}>
                Nouvelle année académique
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl()}>Libellé <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    value={anneeForm.libelle}
                    onChange={(e) => setAnneeForm((f) => ({ ...f, libelle: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAnnee()}
                    placeholder="Ex: 2025-2026"
                    style={inp()}
                  />
                </div>
                <div>
                  <label style={lbl()}>Date début</label>
                  <input
                    type="date"
                    value={anneeForm.dateDebut}
                    onChange={(e) => setAnneeForm((f) => ({ ...f, dateDebut: e.target.value }))}
                    style={inp()}
                  />
                </div>
                <div>
                  <label style={lbl()}>Date fin</label>
                  <input
                    type="date"
                    value={anneeForm.dateFin}
                    onChange={(e) => setAnneeForm((f) => ({ ...f, dateFin: e.target.value }))}
                    style={inp()}
                  />
                </div>
                <button onClick={handleCreateAnnee} disabled={savingAnnee} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingAnnee ? 0.7 : 1, flexShrink: 0 }}>
                  {savingAnnee ? '…' : '+ Créer'}
                </button>
              </div>
            </div>

            {/* Liste */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6ebf1', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Années académiques ({annees.length})
              </div>
              {loadingAnnees ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
              ) : annees.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune année académique créée</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px,1fr) 150px 150px 110px 260px', gap: 12, padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', alignItems: 'center' }}>
                    {['Année', 'Date début', 'Date fin', 'Statut', 'Actions'].map((h) => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</span>
                    ))}
                  </div>
                  {annees.map((a, idx) => {
                    const isCourante = a.estCourante || a.active;
                    const edit = editAnnees[a.id] ?? { libelle: a.libelle, dateDebut: toDateInput(a.dateDebut), dateFin: toDateInput(a.dateFin) };
                    const isSavingThis = savingAnneeId === a.id;
                    return (
                      <div key={a.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(190px,1fr) 150px 150px 110px 260px', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: idx < annees.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isCourante ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
                          <input
                            value={edit.libelle}
                            onChange={(e) => setEditAnnees((prev) => ({ ...prev, [a.id]: { ...edit, libelle: e.target.value } }))}
                            style={{ ...inp(), height: 32, fontWeight: isCourante ? 700 : 500, minWidth: 0 }}
                          />
                        </div>
                        <input
                          type="date"
                          value={edit.dateDebut}
                          onChange={(e) => setEditAnnees((prev) => ({ ...prev, [a.id]: { ...edit, dateDebut: e.target.value } }))}
                          style={{ ...inp(), height: 32 }}
                        />
                        <input
                          type="date"
                          value={edit.dateFin}
                          onChange={(e) => setEditAnnees((prev) => ({ ...prev, [a.id]: { ...edit, dateFin: e.target.value } }))}
                          style={{ ...inp(), height: 32 }}
                        />
                        <span style={{ justifySelf: 'start', fontSize: 10, fontWeight: 800, color: isCourante ? '#16a34a' : '#64748b', background: isCourante ? '#dcfce7' : '#f1f5f9', padding: '4px 8px' }}>
                          {isCourante ? 'EN COURS' : 'CLOTURÉE'}
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={() => handleSaveAnnee(a.id)} disabled={isSavingThis} style={{ height: 30, padding: '0 10px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: isSavingThis ? 0.6 : 1 }}>
                            Enregistrer
                          </button>
                          {!isCourante && (
                            <button onClick={() => handleActiverAnnee(a.id)} disabled={isSavingThis} style={{ height: 30, padding: '0 12px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: isSavingThis ? 0.6 : 1 }}>
                              Débuter
                            </button>
                          )}
                          {isCourante && (
                            <button onClick={() => handleFinirAnnee(a.id)} disabled={isSavingThis} style={{ height: 30, padding: '0 12px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: isSavingThis ? 0.6 : 1 }}>
                              Finir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── BÂTIMENTS & SALLES ────────────────────────────────────── */}
        {activeTab === 'batiments' && (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Bâtiments */}
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Bâtiments</span>
                  <button onClick={() => { setEditBatId(null); setBatForm({ nom: '', description: '' }); setShowBatModal(true); }} style={{ height: 30, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    + Ajouter
                  </button>
                </div>
                {batLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
                ) : batiments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Aucun bâtiment</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {batiments.map((b) => {
                      const sallesCount = batSalles.filter((s) => s.batimentId === b.id).length;
                      return (
                        <div key={b.id} style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{b.nom}</span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>{sallesCount} salle{sallesCount > 1 ? 's' : ''}</span>
                          </div>
                          {b.description && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{b.description}</div>}
                          <button onClick={() => { setEditBatId(b.id); setBatForm({ nom: b.nom, description: b.description ?? '' }); setShowBatModal(true); }}
                            style={{ fontSize: 11, color: '#2563eb', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                            Modifier
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Salles */}
            <div style={{ flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Salles</span>
                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{batSalles.length} salle(s)</span>
                  </div>
                  <button onClick={() => { setEditSalleId(null); setSalleForm({ batimentId: batiments[0]?.id ?? '', nom: '', capacite: '', typeSalle: '' }); setShowSalleModal(true); }}
                    disabled={batiments.length === 0}
                    style={{ height: 30, padding: '0 12px', border: 'none', background: batiments.length === 0 ? '#e2e8f0' : '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: batiments.length === 0 ? 'default' : 'pointer' }}>
                    + Ajouter
                  </button>
                </div>

                {batSalles.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    {batiments.length === 0 ? 'Ajoutez d\'abord un bâtiment' : 'Aucune salle'}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 60px', padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                      {['Salle', 'Bâtiment', 'Capacité', 'Type', ''].map((h) => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                      ))}
                    </div>
                    {batSalles.map((s, si) => {
                      const bat = batiments.find((b) => b.id === s.batimentId);
                      return (
                        <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px 60px', padding: '10px 20px', borderBottom: si < batSalles.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.nom}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{bat?.nom ?? '—'}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{s.capacite ?? '—'}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.typeSalle ?? '—'}</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setEditSalleId(s.id); setSalleForm({ batimentId: s.batimentId, nom: s.nom, capacite: String(s.capacite ?? ''), typeSalle: s.typeSalle ?? '' }); setShowSalleModal(true); }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                            </button>
                            <button onClick={() => handleDeleteSalle(s.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal bâtiment */}
        {showBatModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', width: 400, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editBatId ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom *</label>
                <input value={batForm.nom} onChange={(e) => setBatForm((f) => ({ ...f, nom: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Ex: Bâtiment A" autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Description</label>
                <input value={batForm.description} onChange={(e) => setBatForm((f) => ({ ...f, description: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Optionnel" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowBatModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSaveBat} disabled={batSaving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: batSaving ? 0.7 : 1 }}>
                  {batSaving ? 'Enregistrement…' : editBatId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal salle */}
        {showSalleModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editSalleId ? 'Modifier la salle' : 'Nouvelle salle'}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Bâtiment *</label>
                <select value={salleForm.batimentId} onChange={(e) => setSalleForm((f) => ({ ...f, batimentId: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="">Sélectionner…</option>
                  {batiments.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom de la salle *</label>
                <input value={salleForm.nom} onChange={(e) => setSalleForm((f) => ({ ...f, nom: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Ex: Salle 101" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Capacité</label>
                  <input type="number" min={1} value={salleForm.capacite} onChange={(e) => setSalleForm((f) => ({ ...f, capacite: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Ex: 40" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type</label>
                  <select value={salleForm.typeSalle} onChange={(e) => setSalleForm((f) => ({ ...f, typeSalle: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Standard</option>
                    <option value="CLASSE">Classe</option>
                    <option value="LABO">Laboratoire</option>
                    <option value="INFORMATIQUE">Informatique</option>
                    <option value="SPORT">Sport / Terrain</option>
                    <option value="REUNION">Réunion</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSalleModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSaveSalle} disabled={batSaving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: batSaving ? 0.7 : 1 }}>
                  {batSaving ? 'Enregistrement…' : editSalleId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── WHATSAPP ─────────────────────────────────────────────── */}
        {activeTab === 'whatsapp' && (
          <div style={{ maxWidth: 640 }}>
            {/* Status card */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M20.52 3.449A11.997 11.997 0 0 0 12.003 0C5.376 0 .007 5.368.004 11.993c-.001 2.114.552 4.178 1.603 5.996L0 24l6.194-1.625a12.07 12.07 0 0 0 5.805 1.48h.005c6.625 0 11.994-5.369 11.997-11.995a11.93 11.93 0 0 0-3.481-8.411zM12.003 21.93a9.985 9.985 0 0 1-5.093-1.393l-.366-.217-3.793.995 1.012-3.697-.239-.38A9.956 9.956 0 0 1 2.02 11.993C2.023 6.465 6.473 2.017 12.007 2.017c2.655.001 5.151 1.036 7.03 2.914A9.916 9.916 0 0 1 21.98 12c-.003 5.528-4.453 9.93-9.977 9.93zm5.45-7.452c-.298-.149-1.764-.871-2.037-.97-.274-.099-.474-.149-.673.149-.199.297-.771.97-.945 1.168-.174.199-.348.224-.646.075-.298-.149-1.26-.465-2.4-1.483-.887-.792-1.485-1.77-1.659-2.068-.174-.298-.019-.459.131-.607.134-.133.298-.347.448-.521.15-.173.199-.297.299-.496.099-.198.05-.372-.025-.521-.075-.148-.673-1.622-.923-2.22-.243-.581-.49-.502-.673-.511l-.574-.01c-.199 0-.521.075-.793.371-.273.297-1.04 1.018-1.04 2.48 0 1.464 1.065 2.878 1.213 3.077.149.198 2.095 3.2 5.076 4.487.709.307 1.263.49 1.694.627.712.227 1.36.195 1.872.118.571-.085 1.764-.721 2.013-1.416.248-.695.248-1.292.173-1.416-.074-.124-.273-.199-.571-.348z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>WhatsApp Business</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, background: waConnected ? '#16a34a' : '#dc2626', borderRadius: '50%', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, color: waConnected ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {waConnected ? `Connecté · ${waPhone}` : 'Non connecté'}
                    </span>
                  </div>
                </div>
                {waConnected && (
                  <button onClick={handleDisconnectWa} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Déconnecter
                  </button>
                )}
              </div>

              {!waConnected && (
                <div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                    Connectez votre numéro WhatsApp Business pour envoyer des notifications automatiques aux parents et au personnel (bulletins, paiements, absences, annonces).
                  </div>
                  {!qrVisible && (
                    <button onClick={handleGenerateQr} disabled={loadingQr} style={{ height: 42, padding: '0 24px', border: 'none', background: '#25d366', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loadingQr ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {loadingQr ? (
                        <>
                          <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                          Génération du QR code…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          Générer le QR code
                        </>
                      )}
                    </button>
                  )}
                  {qrVisible && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      {/* QR placeholder */}
                      <div style={{ display: 'inline-block', padding: 16, background: '#fff', border: '2px solid #e6ebf1', marginBottom: 12 }}>
                        <div style={{ width: 180, height: 180, background: 'repeating-conic-gradient(#0f172a 0% 25%, #fff 0% 50%) 0 0 / 12px 12px', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)', width: 36, height: 36, background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20.52 3.449A11.997 11.997 0 0 0 12.003 0C5.376 0 .007 5.368.004 11.993c-.001 2.114.552 4.178 1.603 5.996L0 24l6.194-1.625a12.07 12.07 0 0 0 5.805 1.48h.005c6.625 0 11.994-5.369 11.997-11.995a11.93 11.93 0 0 0-3.481-8.411z"/></svg>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
                        Scannez ce QR code avec votre application WhatsApp
                      </div>
                      <div style={{ fontSize: 12, color: qrCountdown <= 10 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
                        Expire dans {qrCountdown}s
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <button onClick={() => { setQrVisible(false); setWaConnected(true); setWaPhone('+222 12 34 56 78'); }} style={{ height: 34, padding: '0 16px', border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginRight: 8 }}>
                          Simuler connexion
                        </button>
                        <button onClick={() => setQrVisible(false)} style={{ height: 34, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {waConnected && (
                <div>
                  <button onClick={handleTestWa} style={{ height: 34, padding: '0 16px', border: '1px solid #25d366', background: '#fff', color: '#16a34a', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Envoyer un message de test
                  </button>
                </div>
              )}
            </div>

            {/* Features */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Fonctionnalités automatiques</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'envoisAutomatiques', label: 'Envois automatiques', desc: 'Activer tous les envois WhatsApp automatiques' },
                  { key: 'notifBulletins', label: 'Bulletins', desc: 'Notifier les parents lors de la publication des bulletins' },
                  { key: 'notifPaiements', label: 'Rappels paiements', desc: 'Rappeler les paiements en retard' },
                  { key: 'notifAbsences', label: 'Absences élèves', desc: 'Alerter les parents en cas d\'absence' },
                  { key: 'notifAnnonces', label: 'Annonces', desc: 'Envoyer les annonces de l\'école' },
                ] .map((feat) => (
                  <div key={feat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{feat.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{feat.desc}</div>
                    </div>
                    <button
                      onClick={() => setWaFeatures((prev) => ({ ...prev, [feat.key]: !prev[feat.key as keyof typeof prev] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                        background: waFeatures[feat.key as keyof typeof waFeatures] ? '#2563eb' : '#d1d5db',
                        position: 'relative', transition: 'background .2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, left: waFeatures[feat.key as keyof typeof waFeatures] ? 22 : 3,
                        width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left .2s',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
              {waConnected && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => toast.success('Fonctionnalités mises à jour')} style={{ height: 36, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Enregistrer les préférences
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COEFFICIENTS ─────────────────────────────────────────── */}
        {activeTab === 'coefficients' && (
          <div>
            {/* Assign form */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e6ebf1' }}>
                Assigner une matière à un niveau
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px auto', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={lbl()}>Niveau *</label>
                  <select value={selectedNiveauId} onChange={(e) => setSelectedNiveauId(e.target.value)} style={{ ...inp() }}>
                    <option value="">Sélectionner…</option>
                    {coefNiveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl()}>Matière *</label>
                  <select value={assignForm.matiereId} onChange={(e) => setAssignForm((f) => ({ ...f, matiereId: e.target.value }))} style={{ ...inp() }}>
                    <option value="">Sélectionner…</option>
                    {coefMatieres.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl()}>Coeff.</label>
                  <input type="number" value={assignForm.coefficient} onChange={(e) => setAssignForm((f) => ({ ...f, coefficient: e.target.value }))} style={inp()} min={1} max={10} />
                </div>
                <button onClick={handleAssign} disabled={savingAssign} style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: savingAssign ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                  {savingAssign ? '…' : 'Assigner'}
                </button>
              </div>
            </div>

            {/* Coefficients table */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              {loadingCoefRows ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
              ) : coefRows.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune matière assignée. Utilisez le formulaire ci-dessus pour assigner.</div>
              ) : (() => {
                // Grouper par niveau
                const byNiveau = new Map<string, { niveauNom: string; rows: typeof coefRows }>();
                for (const r of coefRows) {
                  const nid = r.niveauId ?? r.niveau?.id ?? '';
                  const nnom = r.niveau?.libelle ?? r.niveau?.nom ?? coefNiveaux.find((n) => n.id === nid)?.nom ?? '—';
                  if (!byNiveau.has(nid)) byNiveau.set(nid, { niveauNom: nnom, rows: [] });
                  byNiveau.get(nid)!.rows.push(r);
                }
                return Array.from(byNiveau.entries()).map(([nid, { niveauNom, rows }]) => (
                  <div key={nid}>
                    <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{niveauNom}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{rows.length} matière(s)</span>
                    </div>
                    {rows.map((r, idx) => (
                      <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 72px', padding: '10px 20px', borderBottom: idx < rows.length - 1 ? '1px solid #f1f5f9' : '1px solid #e6ebf1', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.matiere?.libelle ?? '—'}</span>
                        <input type="number" value={getEditCoef(r.id, r.coefficient ?? 1)}
                          onChange={(e) => setEditCoefs((prev) => ({ ...prev, [r.id]: Number(e.target.value) }))}
                          onBlur={() => handleSaveCoef(r.id, getEditCoef(r.id, r.coefficient ?? 1))}
                          style={{ width: 60, height: 28, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 13, fontFamily: 'inherit', textAlign: 'center' }}
                          min={1} max={10} />
                        <button onClick={() => handleSaveCoef(r.id, getEditCoef(r.id, r.coefficient ?? 1))} style={{ height: 26, padding: '0 10px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                          Enregistrer
                        </button>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL CYCLE ── */}
      {showCycleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 400, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editCycleId ? 'Modifier le cycle' : 'Nouveau cycle'}</div>
            <div style={fieldWrap()}>
              <label style={lbl()}>Nom du cycle *</label>
              <input value={cycleForm.nom} onChange={(e) => setCycleForm((f) => ({ ...f, nom: e.target.value }))} style={inp()} placeholder="Ex: Collège, Lycée" autoFocus />
            </div>
            <div style={fieldWrap(20)}>
              <label style={lbl()}>Découpage de l'année</label>
              <select value={cycleForm.typePeriode} onChange={(e) => setCycleForm((f) => ({ ...f, typePeriode: e.target.value }))} style={{ ...inp(), cursor: 'pointer' }}>
                <option value="TRIMESTRE">Trimestres (T1, T2, T3)</option>
                <option value="SEMESTRE">Semestres (S1, S2)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCycleModal(false); setEditCycleId(null); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSaveCycle} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editCycleId ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NIVEAU ── */}
      {showNiveauModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouveau niveau</div>
            <div style={fieldWrap()}>
              <label style={lbl()}>Cycle *</label>
              <select value={niveauForm.sectionId} onChange={(e) => setNiveauForm((f) => ({ ...f, sectionId: e.target.value }))} style={{ ...inp() }}>
                <option value="">Sélectionner…</option>
                {cycles.filter((s) => s.actif).map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div style={fieldWrap()}>
              <label style={lbl()}>Nom du niveau *</label>
              <input value={niveauForm.niveau} onChange={(e) => setNiveauForm((f) => ({ ...f, niveau: e.target.value }))} style={inp()} placeholder="Ex: 6ème" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Inscription ({getDevise(ecoleForm.pays)})</label>
                <input type="number" value={niveauForm.inscription} onChange={(e) => setNiveauForm((f) => ({ ...f, inscription: e.target.value }))} style={inp()} placeholder="0" />
              </div>
              <div>
                <label style={lbl()}>Mensualité ({getDevise(ecoleForm.pays)})</label>
                <input type="number" value={niveauForm.mensualite} onChange={(e) => setNiveauForm((f) => ({ ...f, mensualite: e.target.value }))} style={inp()} placeholder="0" />
              </div>
              <div>
                <label style={lbl()}>Nb de mois</label>
                <input type="number" value={niveauForm.nbMois} onChange={(e) => setNiveauForm((f) => ({ ...f, nbMois: e.target.value }))} style={inp()} min={1} max={12} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNiveauModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleAddNiveau} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
