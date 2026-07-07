'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@/types/auth';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

const SIDEBAR_W = 264;

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
      { label: 'Tableau de bord', href: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    ],
  },
  {
    label: 'GESTION SCOLAIRE',
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
      { label: 'Professeurs', href: '/admin/professeurs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
      { label: 'Matières', href: '/admin/matieres', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
      { label: 'Notes (supervision)', href: '/admin/notes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
      { label: 'Bulletins', href: '/admin/bulletins', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { label: 'Emplois du temps', href: '/admin/emplois-du-temps', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
      { label: 'Examens', href: '/admin/examens', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
      { label: 'Devoirs', href: '/admin/devoirs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> },
    ],
  },
  {
    label: 'VIE SCOLAIRE',
    items: [
      { label: 'Absences élèves', href: '/admin/absences-eleves', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg> },
      { label: 'Discipline', href: '/admin/discipline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { label: 'Réclamations', href: '/admin/reclamations', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    ],
  },
  {
    label: 'PERSONNEL & RH',
    items: [
      { label: 'Personnel', href: '/admin/personnel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { label: 'Absences personnel', href: '/admin/absences-personnel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> },
    ],
  },
  {
    label: 'FINANCES',
    items: [
      { label: 'Paiements & Suivi', href: '/admin/paiements', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="1"/><path d="M1 10h22"/></svg> },
    ],
  },
  {
    label: 'COMMUNICATION & DOCS',
    items: [
      { label: 'Communication', href: '/admin/communication', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> },
      { label: 'Documents', href: '/admin/documents', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { label: 'Rapports', href: '/admin/rapports', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
      { label: 'Calendrier scolaire', href: '/admin/calendrier-scolaire', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg> },
      { label: 'Bibliothèque', href: '/admin/bibliotheque', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
      { label: 'Santé scolaire', href: '/admin/sante', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
      { label: 'Utilisateurs & Rôles', href: '/admin/utilisateurs-roles', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg> },
      { label: 'Journal d\'audit', href: '/admin/audit', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/><circle cx="18" cy="18" r="4"/><path d="m20.5 20.5-1.5-1.5"/></svg> },
      { label: 'Archives', href: '/admin/archives', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> },
    ],
  },
  {
    label: 'PARAMÈTRES',
    items: [
      { label: 'Paramètres', href: '/admin/parametres', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg> },
      { label: 'Configuration', href: '/admin/configuration', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    ],
  },
  {
    label: 'COMPTE',
    items: [
      { label: 'Mon profil', href: '/admin/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
    ],
  },
];

// ─── ENSEIGNANT ─────────────────────────────────────────────────────────────
const enseignantSections: NavSection[] = [
  { items: [
    { label: 'Tableau de bord', href: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label: 'Mes classes', href: '/professeur/mes-classes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { label: 'Emploi du temps', href: '/professeur/emploi-du-temps', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { label: "Faire l'appel", href: '/professeur/appel', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { label: 'Saisir les notes', href: '/professeur/saisir-notes', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> },
    { label: 'Cahier de textes', href: '/professeur/cahier-de-textes', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { label: 'Absences', href: '/professeur/absences', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg> },
    { label: 'Mes paiements', href: '/professeur/paiements', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="1"/><path d="M1 10h22"/></svg> },
    { label: 'Mon profil', href: '/professeur/profil', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
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
  { label: 'CAISSE', items: [
    { label: 'Encaissement', href: '/caisse/encaissement', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { label: 'Paiements en attente', href: '/caisse/paiements', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="1"/><path d="M1 10h22"/></svg> },
    { label: 'Historique', href: '/caisse/historique', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg> },
  ]},
  { label: 'SCOLARITÉ', items: [
    { label: 'Scolarité', href: '/admin/inscriptions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v6M9 14h6"/></svg> },
    { label: 'Salaires profs', href: '/caisse/salaires-professeurs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ]},
];

// ─── SUPER ADMIN ────────────────────────────────────────────────────────────
const superAdminSections: NavSection[] = [
  { items: [
    { label: 'Statistiques', href: '/platform/stats', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: 'Établissements', href: '/platform/tenants', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Audit logs', href: '/platform/audit-logs', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
  ]},
];

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
    { label: 'Absences personnel', href: '/admin/absences-personnel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> },
    { label: 'Pointages', href: '/admin/pointages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
  ]},
  { label: 'COMPTE', items: [
    { label: 'Mon profil', href: '/rh/profil', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]},
];

const sectionsByRole: Record<UserRole, NavSection[]> = {
  ADMIN: adminSections,
  GESTIONNAIRE: adminSections,
  RH: rhSections,
  ENSEIGNANT: enseignantSections,
  SURVEILLANT: surveillantSections,
  CAISSIER: caisseSections,
  COMPTABLE: caisseSections,
  SUPER_ADMIN: superAdminSections,
  ELEVE: eleveSections,
  PARENT: parentSections,
};

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = (user?.role ?? 'ADMIN') as UserRole;
  const sections = sectionsByRole[role] ?? adminSections;

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}` || 'NS';
  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';
  const roleLabel = user?.role ?? '';

  const [ecoleNom, setEcoleNom] = useState('');
  const [ecoleLogo, setEcoleLogo] = useState('');

  useEffect(() => {
    apiClient.get('/configuration/ecole-identite')
      .then((res) => {
        setEcoleNom(res.data?.nom ?? '');
        setEcoleLogo(res.data?.logoUrl ?? '');
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

  return (
    <aside style={{ width: SIDEBAR_W, flexShrink: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo école */}
      <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e293b', minHeight: 64 }}>
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
        <span
          title={ecoleNom || 'Noura School'}
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
          {ecoleNom || 'Noura School'}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px', scrollbarWidth: 'none' }}>
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '.08em', padding: '10px 10px 4px' }}>
                {section.label}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      color: isActive ? '#fff' : '#94a3b8',
                      fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                      background: isActive ? '#1d4ed8' : 'transparent',
                      borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : '#64748b', lineHeight: 0, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge ? <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 8 }}>{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: '#1e293b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{roleLabel}</div>
        </div>
      </div>
    </aside>
  );
}
