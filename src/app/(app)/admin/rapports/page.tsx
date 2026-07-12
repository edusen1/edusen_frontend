'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminStats, useAdminStatsMensuel, useAdminAnneesAcademiques } from '@/hooks/use-query-api';
import { adminApi } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/client';

// ─── Icônes SVG ───────────────────────────────────────────────────────────────
function IconUsers({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconGradCap({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function IconCreditCard({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconCalendar({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFileText({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconBarChart({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function IconTrendingUp({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconAlertTriangle({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconInfo({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconArrowRight({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconBook({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconClock({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMail({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconShield({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type StatsData = Record<string, unknown>;
type MonthData = { mois: number; encaissements: number; fraisAttendus: number; absences: number; retards: number; tauxPresence: number };
type Alerte = { type: string; texte: string; href?: string };
type CycleItem = { cycle: string; label: string; nb: number };
type ClasseItem = { classeId: string; classeNom: string; eleves: number };

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const BORDER = '#e6ebf1';
const PANEL_BG = '#f8fafc';

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k';
  return String(n);
}

// ─── Composants ───────────────────────────────────────────────────────────────
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: '#64748b' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{label}</span>
    </div>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .3s' }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RapportsPage() {
  const currentYear = new Date().getFullYear();
  const [annee, setAnnee] = useState(String(currentYear));
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { data: statsRaw } = useAdminStats();
  const { data: mensuelRaw } = useAdminStatsMensuel({ annee });
  const { data: anneesAcademiques } = useAdminAnneesAcademiques();
  const anneesListe: { id: string; libelle: string }[] = Array.isArray(anneesAcademiques) ? anneesAcademiques : [];

  const stats: StatsData = (statsRaw && typeof statsRaw === 'object' && !Array.isArray(statsRaw))
    ? statsRaw as StatsData
    : {};

  const mensuel: MonthData[] = Array.isArray(mensuelRaw) ? mensuelRaw as MonthData[] : [];

  // Effectifs
  const eleves = Number(stats.eleves ?? stats.totalEleves ?? 0);
  const professeurs = Number(stats.professeurs ?? stats.totalProfesseurs ?? 0);
  const personnels = Number(stats.personnels ?? stats.totalPersonnel ?? 0);
  const parents = Number(stats.parents ?? 0);
  const classes = Number(stats.classes ?? stats.totalClasses ?? 0);
  const inscriptionsActives = Number(stats.inscriptionsActives ?? 0);
  const totalFilles = Number(stats.totalFilles ?? 0);
  const totalGarcons = Number(stats.totalGarcons ?? 0);

  // Absences
  const absencesEleves = Number(stats.absencesEleves ?? 0);
  const absencesDuJourEleves = Number(stats.absencesDuJourEleves ?? 0);
  const retardsEleves = Number(stats.retardsEleves ?? 0);
  const absencesJustifiees = Number(stats.absencesJustifiees ?? 0);

  // Finances
  const montantValide = Number(stats.montantPaiements ?? 0);
  const montantEnAttente = Number(stats.montantPaiementsEnAttente ?? 0);
  const paiementsEnAttente = Number(stats.paiementsEnAttente ?? 0);
  const paiementsValides = Number(stats.paiementsValides ?? 0);
  const montantTotal = montantValide + montantEnAttente;
  const tauxRecouvrement = montantTotal > 0 ? Math.round((montantValide / montantTotal) * 100) : 0;

  // Bulletins / pédagogie
  const bulletinsValides = Number(stats.bulletinsValides ?? 0);
  const bulletinsBrouillons = Number(stats.bulletinsBrouillons ?? 0);
  const moyenneNotes = Number(stats.moyenneNotes ?? 0);

  // Répartitions
  const repartitionCycles: CycleItem[] = Array.isArray(stats.repartitionCycles) ? stats.repartitionCycles as CycleItem[] : [];
  const elevesParClasse: ClasseItem[] = Array.isArray(stats.elevesParClasse) ? (stats.elevesParClasse as ClasseItem[]).sort((a, b) => b.eleves - a.eleves).slice(0, 6) : [];
  const alertes: Alerte[] = Array.isArray(stats.alertes) ? stats.alertes as Alerte[] : [];
  const maxCycleNb = repartitionCycles.reduce((m, c) => Math.max(m, c.nb), 1);
  const maxClasseNb = elevesParClasse.reduce((m, c) => Math.max(m, c.eleves), 1);

  // Stats mensuelles : max pour échelle
  const maxEncaissement = mensuel.reduce((m, mo) => Math.max(m, mo.encaissements), 1);
  const maxAbsences = mensuel.reduce((m, mo) => Math.max(m, mo.absences + mo.retards), 1);

  // ─── Exports CSV ────────────────────────────────────────────────────────────

  function dlCSV(rows: string[][], filename: string) {
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSVStats() {
    dlCSV([
      ['Indicateur', 'Valeur'],
      ['Élèves inscrits', String(eleves)],
      ['Professeurs', String(professeurs)],
      ['Personnel admin', String(personnels)],
      ['Parents', String(parents)],
      ['Classes', String(classes)],
      ['Inscriptions actives', String(inscriptionsActives)],
      ['Absences totales élèves', String(absencesEleves)],
      ['Absences du jour', String(absencesDuJourEleves)],
      ['Retards total', String(retardsEleves)],
      ['Absences justifiées', String(absencesJustifiees)],
      ['Montant recouvré (FCFA)', String(montantValide)],
      ['Montant en attente (FCFA)', String(montantEnAttente)],
      ['Taux recouvrement (%)', String(tauxRecouvrement)],
      ['Bulletins validés', String(bulletinsValides)],
      ['Bulletins brouillons', String(bulletinsBrouillons)],
    ], `rapport_etablissement_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportCSVMensuel() {
    const rows: string[][] = [['Mois', 'Encaissements (FCFA)', 'Frais attendus', 'Absences', 'Retards', 'Taux présence (%)']];
    mensuel.forEach((m, i) => {
      rows.push([MOIS[i] ?? String(m.mois ?? i + 1), String(m.encaissements ?? 0), String(m.fraisAttendus ?? 0), String(m.absences ?? 0), String(m.retards ?? 0), String(m.tauxPresence ?? 0)]);
    });
    dlCSV(rows, `tendances_${annee}.csv`);
  }

  // ─── Rapports générables ──────────────────────────────────────────────────

  type R = Record<string, unknown>;

  function s(v: unknown): string { return v == null ? '' : String(v); }

  function fmtDateRaw(v: unknown): string {
    if (!v) return '';
    try { return new Date(String(v)).toLocaleDateString('fr-FR'); } catch { return s(v); }
  }

  const RAPPORTS_CONFIG: {
    id: string;
    label: string;
    desc: string;
    href: string;
    icon: React.ReactNode;
    badge: string | null;
    fetch: () => Promise<unknown>;
    toRows: (data: unknown) => string[][];
    headers: string[];
    filename: string;
    pdfType: string;
  }[] = [
    {
      id: 'bulletins',
      label: 'Bulletins de notes',
      desc: 'Moyennes, rangs et statuts de publication par élève et par période',
      href: '/admin/bulletins',
      icon: <IconFileText size={18} color="#2563eb" />,
      badge: bulletinsBrouillons > 0 ? `${bulletinsBrouillons} brouillon(s)` : null,
      fetch: () => adminApi.bulletins({ size: 500 }).then((r) => r.data),
      headers: ['Élève', 'Classe', 'Période', 'Moyenne', 'Rang', 'Statut', 'Année'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((b) => {
          const e = b.eleve as R | undefined;
          const c = b.classe as R | undefined;
          return [
            e ? `${s(e.prenom)} ${s(e.nom)}`.trim() : s(b.eleveId),
            c ? s(c.nom) : s(b.classeId),
            s(b.trimestre ?? b.periode),
            s(b.moyenne ?? b.moyenneGenerale),
            s(b.rang),
            s(b.statut),
            s((b.anneeAcademique as R | undefined)?.libelle ?? b.anneeScolaire),
          ];
        });
      },
      filename: `rapport_bulletins_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'bulletins',
    },
    {
      id: 'absences',
      label: 'Absences élèves',
      desc: 'Historique complet des absences et retards avec statut de justification',
      href: '/admin/absences-eleves',
      icon: <IconCalendar size={18} color="#d97706" />,
      badge: absencesDuJourEleves > 0 ? `${absencesDuJourEleves} aujourd'hui` : null,
      fetch: () => adminApi.absencesEleves({ size: 1000 }).then((r) => r.data),
      headers: ['Élève', 'Classe', 'Date', 'Type', 'Durée (h)', 'Justifiée', 'Statut', 'Motif'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((a) => {
          const e = a.eleve as R | undefined;
          const c = a.classe as R | undefined;
          return [
            e ? `${s(e.prenom)} ${s(e.nom)}`.trim() : s(a.eleveId),
            c ? s(c.nom) : s(a.classeId),
            fmtDateRaw(a.date ?? a.dateAbsence),
            s(a.type ?? a.typeAbsence),
            s(a.duree ?? a.nbHeures),
            (a.justifiee || a.isJustifiee) ? 'Oui' : 'Non',
            s(a.statut),
            s(a.motif),
          ];
        });
      },
      filename: `rapport_absences_eleves_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'absences-eleves',
    },
    {
      id: 'paiements',
      label: 'Paiements & recouvrement',
      desc: 'État des paiements de frais de scolarité par élève avec montants et statuts',
      href: '/admin/paiements',
      icon: <IconCreditCard size={18} color="#16a34a" />,
      badge: paiementsEnAttente > 0 ? `${paiementsEnAttente} en attente` : null,
      fetch: () => adminApi.paiements({ size: 1000 }).then((r) => r.data),
      headers: ['Élève', 'Classe', 'Montant (FCFA)', 'Méthode', 'Statut', 'Date', 'Référence'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((p) => {
          const e = (p.eleve ?? p.inscription as R | undefined) as R | undefined;
          return [
            e ? `${s(e.prenom)} ${s(e.nom)}`.trim() : s(p.eleveId),
            s((p.classe as R | undefined)?.nom ?? p.classeNom),
            s(p.montant),
            s(p.methodePaiement ?? p.methode),
            s(p.statut),
            fmtDateRaw(p.datePaiement ?? p.createdAt),
            s(p.reference ?? p.id),
          ];
        });
      },
      filename: `rapport_paiements_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'paiements',
    },
    {
      id: 'inscriptions',
      label: 'Inscriptions & effectifs',
      desc: 'Liste des inscriptions avec classe, statut et frais associés',
      href: '/admin/inscriptions',
      icon: <IconUsers size={18} color="#7c3aed" />,
      badge: inscriptionsActives > 0 ? `${inscriptionsActives} actives` : null,
      fetch: () => adminApi.inscriptions({ size: 1000 }).then((r) => r.data),
      headers: ['Élève', 'Classe', 'Niveau', 'Statut', 'Frais (FCFA)', 'Date inscription', 'Année'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((i) => {
          const e = i.eleve as R | undefined;
          const c = i.classe as R | undefined;
          return [
            e ? `${s(e.prenom)} ${s(e.nom)}`.trim() : s(i.eleveId),
            c ? s(c.nom) : s(i.classeId),
            s((c?.niveau as R | undefined)?.nom ?? i.niveauNom),
            s(i.statut),
            s(i.montantFrais ?? i.frais),
            fmtDateRaw(i.dateInscription ?? i.createdAt),
            s((i.anneeAcademique as R | undefined)?.libelle ?? i.anneeScolaire),
          ];
        });
      },
      filename: `rapport_inscriptions_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'inscriptions',
    },
    {
      id: 'pointages',
      label: 'Présences professeurs',
      desc: 'Heures effectuées, taux de présence et retards par enseignant',
      href: '/admin/pointages',
      icon: <IconClock size={18} color="#0891b2" />,
      badge: null,
      fetch: () => adminApi.pointages({ size: 1000 }).then((r) => r.data),
      headers: ['Personnel', 'Poste', 'Date', 'Statut', 'Heure arrivée', 'Heure départ', 'Heures travaillées', 'Méthode'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((p) => {
          const pers = p.personnel as R | undefined;
          const u = pers?.utilisateur as R | undefined;
          const name = u ? `${s(u.firstName ?? u.prenom)} ${s(u.lastName ?? u.nom)}`.trim() : `${s(pers?.prenom)} ${s(pers?.nom)}`.trim() || s(p.personnelId);
          return [
            name,
            s(pers?.poste ?? p.poste),
            fmtDateRaw(p.date),
            s(p.statut),
            s(p.heureArrivee ?? p.arrivee),
            s(p.heureDepart ?? p.depart),
            s(p.heures),
            s(p.methode),
          ];
        });
      },
      filename: `rapport_pointages_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'pointages',
    },
    {
      id: 'emplois',
      label: 'Emplois du temps',
      desc: 'Créneaux horaires par classe, matière et enseignant',
      href: '/admin/emplois-du-temps',
      icon: <IconBarChart size={18} color="#0369a1" />,
      badge: null,
      fetch: () => adminApi.emploisDuTemps({ size: 1000 }).then((r) => r.data),
      headers: ['Classe', 'Matière', 'Professeur', 'Jour', 'Heure début', 'Heure fin', 'Salle'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((e) => {
          const c = e.classe as R | undefined;
          const m = e.matiere as R | undefined;
          const p = e.professeur as R | undefined;
          const pu = p?.utilisateur as R | undefined;
          return [
            c ? s(c.nom) : s(e.classeId),
            m ? s(m.libelle ?? m.nom) : s(e.matiereId),
            pu ? `${s(pu.firstName)} ${s(pu.lastName)}`.trim() : p ? `${s(p.prenom)} ${s(p.nom)}`.trim() : s(e.professeurId),
            s(e.jour),
            s(e.heureDebut),
            s(e.heureFin),
            s(e.salle),
          ];
        });
      },
      filename: `rapport_emplois_du_temps_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'emplois-du-temps',
    },
    {
      id: 'communication',
      label: 'Communication',
      desc: 'Messages envoyés, destinataires et statuts de diffusion',
      href: '/admin/communication',
      icon: <IconMail size={18} color="#4f46e5" />,
      badge: null,
      fetch: () => adminApi.communications({ size: 500 }).then((r) => r.data),
      headers: ['Titre', 'Type', 'Cible', 'Statut', 'Date envoi', 'Expéditeur'],
      toRows: (data) => {
        const list = Array.isArray(data) ? data : ((data as R)?.data ?? (data as R)?.content ?? []) as R[];
        return (list as R[]).map((c) => {
          const u = c.createdBy as R | undefined;
          return [
            s(c.titre ?? c.sujet),
            s(c.type),
            s(Array.isArray(c.cible) ? (c.cible as string[]).join(', ') : c.cible),
            s(c.statut),
            fmtDateRaw(c.dateEnvoi ?? c.createdAt),
            u ? `${s(u.firstName ?? u.prenom)} ${s(u.lastName ?? u.nom)}`.trim() : '',
          ];
        });
      },
      filename: `rapport_communications_${new Date().toISOString().slice(0, 10)}.csv`,
      pdfType: 'communications',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12, flexWrap: 'wrap' }}>
        <IconBarChart size={18} color="#2563eb" />
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Rapports & statistiques</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            style={{ height: 36, border: `1px solid ${BORDER}`, background: '#fff', padding: '0 10px', fontSize: 13, color: '#334155', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportCSVStats}
            style={{ height: 36, padding: '0 14px', border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconFileText size={13} color="#64748b" /> Export stats
          </button>
          <button
            onClick={exportCSVMensuel}
            disabled={mensuel.length === 0}
            style={{ height: 36, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: mensuel.length === 0 ? 'not-allowed' : 'pointer', opacity: mensuel.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconTrendingUp size={13} color="#fff" /> Export mensuel CSV
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* Alertes */}
        {alertes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {alertes.map((a, i) => {
              const isDanger = a.type === 'danger';
              const isWarning = a.type === 'warning';
              const bgColor = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0f9ff';
              const borderColor = isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#bae6fd';
              const textColor = isDanger ? '#dc2626' : isWarning ? '#92400e' : '#0369a1';
              return (
                <div key={i} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isDanger || isWarning
                    ? <IconAlertTriangle size={14} color={textColor} />
                    : <IconInfo size={14} color={textColor} />}
                  <span style={{ fontSize: 12, color: textColor, flex: 1 }}>{a.texte}</span>
                  {a.href && (
                    <Link href={a.href} style={{ fontSize: 11, color: textColor, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Voir <IconArrowRight size={11} color={textColor} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* KPIs principaux */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Élèves inscrits" value={eleves} color="#2563eb" sub={inscriptionsActives > 0 ? `${inscriptionsActives} inscriptions actives` : undefined} />
          <KpiCard label="Corps enseignant" value={professeurs} color="#7c3aed" sub={professeurs > 0 ? `+ ${personnels} personnel admin` : undefined} />
          <KpiCard label="Bulletins validés" value={bulletinsValides} color="#16a34a" sub={bulletinsBrouillons > 0 ? `${bulletinsBrouillons} en brouillon` : undefined} />
          <KpiCard label="Absences du jour" value={absencesDuJourEleves} color={absencesDuJourEleves > 0 ? '#dc2626' : '#64748b'} sub={retardsEleves > 0 ? `${retardsEleves} retard(s) total` : undefined} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Finances */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20 }}>
            <SectionTitle icon={<IconCreditCard size={16} />} label="Recouvrement financier" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Recouvré</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{fmtShort(montantValide)}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{paiementsValides} paiement(s)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>En attente</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{fmtShort(montantEnAttente)}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{paiementsEnAttente} paiement(s)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Taux</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: tauxRecouvrement >= 75 ? '#16a34a' : tauxRecouvrement >= 50 ? '#d97706' : '#dc2626' }}>{tauxRecouvrement}%</div>
              </div>
            </div>
            <ProgressBar value={montantValide} max={montantTotal} color="#16a34a" />
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{fmt(montantValide)} récupérés sur {fmt(montantTotal)}</div>
          </div>

          {/* Absences */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20 }}>
            <SectionTitle icon={<IconCalendar size={16} />} label="Absences élèves" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Total absences</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{absencesEleves}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Retards</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{retardsEleves}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Justifiées</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{absencesJustifiees}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Non justifiées</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{absencesEleves - absencesJustifiees}</div>
              </div>
            </div>
            {absencesEleves > 0 && (
              <>
                <ProgressBar value={absencesJustifiees} max={absencesEleves} color="#16a34a" />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{Math.round((absencesJustifiees / absencesEleves) * 100)}% justifiées</div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Effectifs */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20 }}>
            <SectionTitle icon={<IconUsers size={16} />} label="Effectifs & répartition" />
            {/* Genre */}
            {(totalFilles + totalGarcons) > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Filles — {totalFilles}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Garçons — {totalGarcons}</span>
                </div>
                <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', width: `${Math.round((totalFilles / (totalFilles + totalGarcons)) * 100)}%`, background: '#ec4899', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ height: '100%', flex: 1, background: '#2563eb' }} />
                </div>
              </div>
            )}
            {/* Résumé */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Élèves', value: eleves },
                { label: 'Professeurs', value: professeurs },
                { label: 'Parents', value: parents },
                { label: 'Personnel admin', value: personnels },
                { label: 'Classes', value: classes },
              ].map(item => (
                <div key={item.label} style={{ background: PANEL_BG, border: `1px solid #f1f5f9`, padding: '8px 12px', borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition par cycle */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20 }}>
            <SectionTitle icon={<IconGradCap size={16} />} label="Élèves par cycle" />
            {repartitionCycles.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0', textAlign: 'center' }}>Aucune donnée</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {repartitionCycles.map(c => (
                  <div key={c.cycle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{c.label || c.cycle}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{c.nb}</span>
                    </div>
                    <ProgressBar value={c.nb} max={maxCycleNb} color="#2563eb" />
                  </div>
                ))}
              </div>
            )}

            {/* Pédagogie sous-section */}
            {(bulletinsValides + bulletinsBrouillons) > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Bulletins</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Validés</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{bulletinsValides}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Brouillons</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>{bulletinsBrouillons}</div>
                  </div>
                  {moyenneNotes > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Moyenne générale</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{moyenneNotes.toFixed(2)}/20</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top classes */}
        {elevesParClasse.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20, marginBottom: 20 }}>
            <SectionTitle icon={<IconUsers size={16} />} label="Élèves par classe (top 6)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {elevesParClasse.map(c => (
                <div key={c.classeId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.classeNom}</span>
                    <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0, marginLeft: 4 }}>{c.eleves}</span>
                  </div>
                  <ProgressBar value={c.eleves} max={maxClasseNb} color="#7c3aed" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendances mensuelles */}
        {mensuel.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20, marginBottom: 20 }}>
            <SectionTitle icon={<IconTrendingUp size={16} />} label={`Tendances mensuelles — ${annee}`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Encaissements */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Encaissements</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
                  {mensuel.map((m, i) => {
                    const h = maxEncaissement > 0 ? Math.round((m.encaissements / maxEncaissement) * 72) : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div title={`${MOIS[i]}: ${fmt(m.encaissements)}`} style={{ width: '100%', height: h, background: '#16a34a', borderRadius: '2px 2px 0 0', minHeight: m.encaissements > 0 ? 2 : 0 }} />
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>{MOIS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Absences */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Absences + retards</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
                  {mensuel.map((m, i) => {
                    const total = m.absences + m.retards;
                    const h = maxAbsences > 0 ? Math.round((total / maxAbsences) * 72) : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div title={`${MOIS[i]}: ${total} (${m.absences} abs. + ${m.retards} ret.)`} style={{ width: '100%', height: h, background: '#dc2626', borderRadius: '2px 2px 0 0', minHeight: total > 0 ? 2 : 0 }} />
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>{MOIS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rapports générables */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, padding: 20 }}>
          <SectionTitle icon={<IconBook size={16} />} label="Rapports" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {RAPPORTS_CONFIG.map((r) => (
              <RapportCard key={r.id} config={r} dlCSV={dlCSV} annees={anneesListe} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── RapportCard ──────────────────────────────────────────────────────────────

type RapportConfig = {
  id: string;
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  badge: string | null;
  fetch: () => Promise<unknown>;
  headers: string[];
  toRows: (data: unknown) => string[][];
  filename: string;
  pdfType: string;
};

function RapportCard({ config, dlCSV, annees }: { config: RapportConfig; dlCSV: (rows: string[][], filename: string) => void; annees: { id: string; libelle: string }[] }) {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnees, setSelectedAnnees] = useState<string[]>([]);

  function toggleAnnee(libelle: string) {
    setSelectedAnnees((prev) =>
      prev.includes(libelle) ? prev.filter((a) => a !== libelle) : [...prev, libelle],
    );
  }

  function toggleAll() {
    if (selectedAnnees.length === annees.length) {
      setSelectedAnnees([]);
    } else {
      setSelectedAnnees(annees.map((a) => a.libelle));
    }
  }

  function openPdfModal() {
    setSelectedAnnees([]);
    setShowModal(true);
  }

  async function handleGenererCsv() {
    setLoadingCsv(true);
    try {
      const data = await config.fetch();
      const rows = config.toRows(data);
      if (rows.length === 0) {
        toast.info('Aucune donnée à exporter pour ce rapport');
        return;
      }
      dlCSV([config.headers, ...rows], config.filename);
      toast.success(`${rows.length} ligne(s) exportée(s)`);
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoadingCsv(false);
    }
  }

  async function handleGenererPdf() {
    setLoadingPdf(true);
    setShowModal(false);
    try {
      const params = new URLSearchParams();
      if (selectedAnnees.length > 0) {
        if (selectedAnnees.length === annees.length) {
          params.set('annees', '*');
        } else {
          params.set('annees', selectedAnnees.join(','));
        }
      }
      const qs = params.toString();
      const url = `/admin/rapports/${config.pdfType}/pdf${qs ? '?' + qs : ''}`;
      const res = await apiClient.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      toast.success('Rapport PDF ouvert');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setLoadingPdf(false);
    }
  }

  const busy = loadingCsv || loadingPdf;
  const allSelected = annees.length > 0 && selectedAnnees.length === annees.length;

  return (
    <>
      <div style={{ border: `1px solid #e6ebf1`, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff' }}>
        <div style={{ width: 38, height: 38, background: '#f7f9fe', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          {config.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{config.label}</span>
            {config.badge && (
              <span style={{ fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 10, padding: '1px 7px' }}>{config.badge}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>{config.desc}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => void handleGenererCsv()}
              disabled={busy}
              style={{ height: 30, padding: '0 12px', border: `1px solid #e2e8f0`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {loadingCsv ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  CSV…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export CSV
                </>
              )}
            </button>
            <button
              onClick={openPdfModal}
              disabled={busy}
              style={{ height: 30, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {loadingPdf ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  PDF…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimer PDF
                </>
              )}
            </button>
            <Link href={config.href} style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#2563eb')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#64748b')}
            >
              Voir le module <IconArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Modal selection année(s) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'relative', background: '#fff', width: 380, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)', padding: 0 }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Générer le rapport PDF</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{config.label}</div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            {/* Year selection */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Année(s) académique(s)</div>

              {annees.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Aucune année configurée</div>
              ) : (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', fontSize: 12, fontWeight: 600, color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#2563eb', width: 15, height: 15 }} />
                    Toutes les années
                  </label>
                  {annees.map((a) => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedAnnees.includes(a.libelle)} onChange={() => toggleAnnee(a.libelle)} style={{ accentColor: '#2563eb', width: 15, height: 15 }} />
                      {a.libelle}
                    </label>
                  ))}
                </>
              )}

              {selectedAnnees.length > 1 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  {selectedAnnees.length} années sélectionnées — le rapport inclura une analyse comparative
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ height: 34, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="button" onClick={() => void handleGenererPdf()} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Générer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
