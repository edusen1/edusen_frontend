'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@/types/auth';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

const SIDEBAR_W = 264;
const SIDEBAR_COLLAPSED_W = 72;

function schoolInitials(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function schoolLabel(nom: string): string {
  return nom.length > 20 ? schoolInitials(nom) : nom;
}

interface NavSection { label?: string; items: NavItem[]; }
interface NavItem { label: string; href: string; icon: React.ReactNode; badge?: number; }

// ─── ADMIN ─────────────────────────────────────────────────────────────────
const adminSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/admin/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
      { label: 'Alertes', href: '/admin/alertes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    ],
  },
  {
    label: 'SCOLARITÉ',
    items: [
      { label: 'Élèves', href: '/admin/eleves', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
      { label: 'Scolarité', href: '/admin/inscriptions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg> },
      { label: 'Classes', href: '/admin/classes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></svg> },
      { label: 'Parents', href: '/admin/parents', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    ],
  },
  {
    label: 'PÉDAGOGIE',
    items: [
      { label: 'Enseignants', href: '/admin/professeurs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
      { label: 'Matières', href: '/admin/matieres', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
      { label: 'Bulletins', href: '/admin/bulletins', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { label: 'Emploi du temps', href: '/admin/emplois-du-temps', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
      { label: 'Programmes', href: '/admin/programmes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
      { label: 'Calendrier scolaire', href: '/admin/calendrier-scolaire', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg> },
      // Écrans déjà développés, restés sans lien de navigation.
      { label: 'Bibliothèque', href: '/admin/bibliotheque', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
      { label: 'Archives', href: '/admin/archives', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg> },
    ],
  },
  {
    label: 'VIE SCOLAIRE',
    items: [
      { label: 'Absences', href: '/admin/absences', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg> },
      { label: 'Discipline', href: '/admin/discipline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { label: 'Convocations', href: '/admin/convocations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
      { label: 'Réclamations', href: '/admin/reclamations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    ],
  },
  {
    label: 'ABONNEMENT',
    items: [
      { label: 'Mon abonnement', href: '/admin/paiements', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { label: 'Communication', href: '/admin/communication', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { label: 'Personnel', href: '/admin/personnel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { label: 'Rapports', href: '/admin/rapports', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
      { label: 'Journal d\'audit', href: '/admin/audit', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/><circle cx="18" cy="18" r="4"/><path d="m20.5 20.5-1.5-1.5"/></svg> },
      { label: 'Configuration', href: '/admin/configuration', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg> },
    ],
  },
];

// ─── ENSEIGNANT ─────────────────────────────────────────────────────────────
const enseignantSections: NavSection[] = [
  { items: [
    { label: 'Tableau de bord', href: '/professeur/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label: 'Mes classes', href: '/professeur/mes-classes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { label: 'Emploi du temps', href: '/professeur/emploi-du-temps', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { label: 'Communication', href: '/professeur/communication', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
    // Écran déjà développé, sans équivalent ailleurs : la fonction de signalement
    // disciplinaire était simplement inaccessible aux enseignants.
    { label: 'Discipline', href: '/professeur/discipline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> },
  ]},
  { label: 'PERSONNEL', items: [
    { label: 'Mon profil', href: '/professeur/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
    { label: 'Mes absences', href: '/professeur/absences', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg> },
    { label: 'Configuration', href: '/professeur/configuration', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ]},
];

// ─── SURVEILLANT ────────────────────────────────────────────────────────────
const surveillantSections: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/surveillant/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    ],
  },
  {
    label: 'VIE SCOLAIRE',
    items: [
      { label: 'Absences & Retards', href: '/surveillant/absences', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg> },
      { label: 'Convocations', href: '/surveillant/convocations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg> },
      { label: 'Discipline & Sanctions', href: '/surveillant/discipline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { label: 'Présences enseignants', href: '/surveillant/presences-enseignants', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    ],
  },
  {
    label: 'ORGANISATION',
    items: [
      { label: 'Permanences', href: '/surveillant/permanences', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></svg> },
      { label: 'Autorisations de sortie', href: '/surveillant/autorisations-sortie', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg> },
    ],
  },
  {
    label: 'COMPTE',
    items: [
      { label: 'Mon profil', href: '/surveillant/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
    ],
  },
];

// ─── CAISSE ─────────────────────────────────────────────────────────────────
const caisseSections: NavSection[] = [
  { items: [
    { label: 'Tableau de bord', href: '/caisse/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  ]},
  // Ces quatre écrans existaient déjà mais n'étaient atteignables que par les
  // tuiles du tableau de bord. L'encaissement est le geste quotidien du caissier :
  // il n'avait aucune entrée de menu.
  { label: 'CAISSE', items: [
    { label: 'Encaissement', href: '/caisse/encaissement', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { label: 'Paiements en attente', href: '/caisse/paiements', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
    { label: 'Historique', href: '/caisse/historique', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg> },
  ]},
  { label: 'SCOLARITÉ', items: [
    { label: 'Élèves', href: '/admin/eleves', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { label: 'Scolarité', href: '/admin/inscriptions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v6M9 14h6"/></svg> },
  ]},
  { label: 'COMPTE', items: [
    { label: 'Mon profil', href: '/caisse/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]},
];

// ─── SUPER ADMIN / GESTIONNAIRE ─────────────────────────────────────────────
// Ces rôles n'ont plus de navigation ici : l'administration de la plateforme
// vit dans l'application `edusen_plateforme` et la connexion leur est refusée
// sur ce front. Voir obsidian/super-admin/Super Admin - Vue d'ensemble.md
const superAdminSections: NavSection[] = [];

// ─── ÉLÈVE ──────────────────────────────────────────────────────────────────
const eleveSections: NavSection[] = [
  { items: [
    { label: 'Accueil', href: '/eleve/accueil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
    { label: 'Notes', href: '/eleve/notes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
    { label: 'Bulletins', href: '/eleve/bulletins', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
    { label: 'Emploi du temps', href: '/eleve/emploi-du-temps', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { label: 'Absences', href: '/eleve/absences', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg> },
    { label: 'Réclamations', href: '/eleve/reclamations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Notifications', href: '/eleve/notifications', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },
    { label: 'Profil', href: '/eleve/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
  ]},
];

// ─── PARENT ─────────────────────────────────────────────────────────────────
const parentSections: NavSection[] = [
  { items: [
    { label: 'Mes enfants', href: '/parent/enfants', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
    { label: 'Paiements', href: '/parent/paiements', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="1"/><path d="M1 10h22"/></svg> },
    { label: 'Réclamations', href: '/parent/reclamations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Notifications', href: '/parent/notifications', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },
    { label: 'Profil', href: '/parent/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
  ]},
];

// ─── RH ─────────────────────────────────────────────────────────────────────
const rhSections: NavSection[] = [
  { items: [
    { label: 'Tableau de bord', href: '/rh/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  ]},
  { label: 'RESSOURCES HUMAINES', items: [
    { label: 'Personnel', href: '/admin/personnel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'Pointages', href: '/admin/pointages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
  ]},
  { label: 'COMPTE', items: [
    { label: 'Mon profil', href: '/rh/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]},
];

// ─── SÉCURITÉ ────────────────────────────────────────────────────────────────
const securiteSections: NavSection[] = [
  { items: [
    { label: 'Tableau de bord', href: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  ]},
];

const sectionsByRole: Record<UserRole, NavSection[]> = {
  ADMIN: adminSections,
  GESTIONNAIRE: adminSections,
  RH: rhSections,
  ENSEIGNANT: enseignantSections,
  SURVEILLANT: surveillantSections,
  SECURITE: securiteSections,
  CAISSIER: caisseSections,
  COMPTABLE: caisseSections,
  SUPER_ADMIN: superAdminSections,
  ELEVE: eleveSections,
  PARENT: parentSections,
};

export function AppSidebar({ onClose, collapsed = false, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const role = (user?.role ?? 'ADMIN') as UserRole;
  const sections = sectionsByRole[role] ?? adminSections;

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}` || 'NS';
  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  const roleLabel = user?.role ?? '';
  const profilHrefMap: Record<string, string> = { ADMIN: '/admin/profil', ENSEIGNANT: '/professeur/profil', SURVEILLANT: '/surveillant/profil', ELEVE: '/eleve/profil', PARENT: '/parent/profil', CAISSIER: '/caisse/profil', RH: '/rh/profil' };
  // Repli sur le profil générique : l'ancien repli pointait vers
  // `/professeur/profil`, qui répond 403 pour un comptable, un agent de sécurité
  // ou un gestionnaire — ces rôles n'ont pas de page dédiée.
  const profilHref = profilHrefMap[user?.role ?? ''] ?? '/profil';

  const [ecoleNom, setEcoleNom] = useState('');
  const [ecoleLogo, setEcoleLogo] = useState('');
  const [badges, setBadges] = useState<Record<string, number>>({});

  // Mark feature as seen when user visits a page with a badge
  const featureByPath: Record<string, string> = {
    '/admin/alertes': 'alertes',
    '/admin/reductions': 'reductions',
    '/admin/paiements': 'paiements',
    '/admin/reclamations': 'reclamations',
    '/admin/convocations': 'convocations',
  };
  useEffect(() => {
    const feature = featureByPath[pathname];
    if (feature && badges[pathname]) {
      apiClient.post('/v1/auth/mark-seen', { feature }).catch(() => {});
      setBadges((prev) => { const n = { ...prev }; delete n[pathname]; return n; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    apiClient.get('/configuration/ecole-identite')
      .then((res) => {
        setEcoleNom(res.data?.nom ?? '');
        setEcoleLogo(res.data?.logoUrl ?? '');
      })
      .catch(() => {});

    // Fetch badge counts from backend (persistent)
    apiClient.get('/v1/auth/badges')
      .then((res) => {
        const d = res.data as Record<string, number>;
        const map: Record<string, number> = {};
        if (d.alertes) map['/admin/alertes'] = d.alertes;
        if (d.reductions) map['/admin/reductions'] = d.reductions;
        if (d.paiements) map['/admin/paiements'] = d.paiements;
        if (d.reclamations) map['/admin/reclamations'] = d.reclamations;
        if (d.convocations) map['/admin/convocations'] = d.convocations;
        setBadges(map);
      })
      .catch(() => {});

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ nom?: string; logoUrl?: string }>).detail;
      if (detail?.nom !== undefined) setEcoleNom(detail.nom);
      if (detail?.logoUrl !== undefined) setEcoleLogo(detail.logoUrl);
    };
    window.addEventListener('ecole-config-updated', handler);
    return () => window.removeEventListener('ecole-config-updated', handler);
  }, []);

  const displayLabel = ecoleNom ? schoolLabel(ecoleNom) : 'NS';

  // Don't render until store is hydrated or if user is not set (logging out)
  if (!hydrated || !user) return <aside style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W, flexShrink: 0, background: '#0f172a', height: '100%' }} />;

  return (
    <aside style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W, flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', height: '100%', transition: 'width 180ms ease', overflow: 'hidden' }}>
      {/* Logo école */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={onToggleCollapse ? (collapsed ? 'Développer la sidebar' : 'Réduire la sidebar') : undefined}
        aria-label={onToggleCollapse ? (collapsed ? 'Développer la sidebar' : 'Réduire la sidebar') : undefined}
        style={{ width: '100%', padding: collapsed ? '16px 18px' : '16px 14px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, border: 'none', borderBottom: '1px solid #1e293b', background: 'transparent', minHeight: 64, cursor: onToggleCollapse ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left' }}
      >
        {/* Avatar : logo ou initiales */}
        <div style={{ width: 36, height: 36, flexShrink: 0, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 6, border: '1px solid #334155' }}>
          {ecoleLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ecoleLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px' }}>
              {displayLabel.slice(0, 3)}
            </span>
          )}
        </div>
        {/* Nom */}
        {!collapsed && <span
          title={ecoleNom || 'Edusen'}
          style={{
            color: '#f1f5f9',
            fontWeight: 700,
            fontSize: ecoleNom.length > 20 ? 13 : 14,
            lineHeight: 1.25,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {ecoleNom || 'Edusen'}
        </span>}
      </button>

      {/* Role switcher */}
      {!collapsed && (user?.allRoles?.length ?? 0) > 1 && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e293b' }}>
          <select
            value={role}
            onChange={async (e) => {
              try {
                const res = await apiClient.post('/v1/auth/switch-role', { role: e.target.value });
                const newToken = (res.data as { accessToken?: string })?.accessToken;
                if (newToken) {
                  const payload = JSON.parse(atob(newToken.split('.')[1]));
                  const { setSession } = useAuthStore.getState();
                  const session = useAuthStore.getState().session;
                  if (session) {
                    setSession({ ...session, accessToken: newToken, user: { ...session.user, role: payload.role, allRoles: payload.allRoles } });
                    window.location.reload();
                  }
                }
              } catch { /* ignore */ }
            }}
            style={{ width: '100%', height: 30, background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', padding: '0 8px', cursor: 'pointer' }}
          >
            {user!.allRoles!.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px', scrollbarWidth: 'none' }}>
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && !collapsed && (
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '.08em', padding: '10px 10px 4px' }}>
                {section.label}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  || (item.href === '/professeur/mes-classes' && pathname.startsWith('/professeur/classe/'))
                  || (item.href === '/admin/absences' && (pathname.startsWith('/admin/absences-eleves') || pathname.startsWith('/admin/absences-personnel')));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: collapsed ? 0 : 10,
                      padding: collapsed ? '10px 8px' : '8px 10px',
                      color: isActive ? '#fff' : '#94a3b8',
                      fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                      background: isActive ? '#1d4ed8' : 'transparent',
                      borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : '#64748b', lineHeight: 0, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!collapsed && badges[item.href] ? <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8, minWidth: 16, textAlign: 'center' }}>{badges[item.href]}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: collapsed ? '10px 8px' : '12px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: collapsed ? 8 : 10 }}>
        <Link href={profilHref} title={collapsed ? fullName : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: collapsed ? 0 : 10, flex: collapsed ? 'none' : 1, minWidth: 0, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#1e293b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          {!collapsed && <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{roleLabel}</div>
          </div>}
        </Link>
        <button
          onClick={() => { clearSession(); router.push('/login'); }}
          title="Déconnexion"
          style={{ width: 32, height: 32, background: 'transparent', border: '1px solid #334155', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
}
