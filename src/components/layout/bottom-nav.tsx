'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const eleveNav = [
  {
    label: 'Accueil',
    href: '/eleve/accueil',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>
      </svg>
    ),
  },
  {
    label: 'Notes',
    href: '/eleve/notes',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    label: 'Planning',
    href: '/eleve/emploi-du-temps',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: 'Absences',
    href: '/eleve/absences',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <path d="M12 9v4M12 17h.01"/>
      </svg>
    ),
  },
  {
    label: 'Profil',
    href: '/eleve/profil',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
      </svg>
    ),
  },
];

const parentNav = [
  {
    label: 'Enfants',
    href: '/parent/enfants',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>
      </svg>
    ),
  },
  {
    label: 'Paiements',
    href: '/parent/paiements',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
      </svg>
    ),
  },
  {
    label: 'Réclamations',
    href: '/parent/reclamations',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Planning',
    href: '/parent/emploi-du-temps',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: 'Profil',
    href: '/parent/profil',
    icon: (active: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const items = user?.role === 'PARENT' ? parentNav : eleveNav;

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#fff', borderTop: '1px solid #e6ebf1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '6px 8px' }}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px', textDecoration: 'none', minWidth: 0 }}
            >
              {item.icon(isActive)}
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? '#2563eb' : '#64748b' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
