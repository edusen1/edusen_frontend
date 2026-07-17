'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAuthStore } from '@/stores/auth-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const { session, user } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSidebarHidden(window.localStorage.getItem('sidebar-hidden') === 'true');
  }, []);

  const toggleDesktopSidebar = () => {
    setSidebarHidden((hidden) => {
      const next = !hidden;
      window.localStorage.setItem('sidebar-hidden', String(next));
      return next;
    });
  };
  // Auth guard: redirect to login if no session
  useEffect(() => {
    // Wait one tick for Zustand hydration
    const t = setTimeout(() => {
      if (!useAuthStore.getState().session) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [session, router]);

  // Show nothing until auth is verified
  if (!ready || !session) {
    return <div style={{ height: '100vh', background: '#0f172a' }} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa' }}>
      {/* Desktop sidebar — all roles */}
      {!sidebarHidden && (
        <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
          <AppSidebar />
        </div>
      )}

      <button
        type="button"
        className="hidden lg:flex"
        onClick={toggleDesktopSidebar}
        title={sidebarHidden ? 'Afficher la sidebar' : 'Masquer la sidebar'}
        aria-label={sidebarHidden ? 'Afficher la sidebar' : 'Masquer la sidebar'}
        style={{
          position: 'fixed', top: 16, left: sidebarHidden ? 12 : 236, zIndex: 60,
          width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
          border: '1px solid #334155', borderRadius: 8, background: '#0f172a',
          color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,.2)',
          transition: 'left 180ms ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {sidebarHidden ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
        </svg>
      </button>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" style={{ padding: 0, width: 264, background: '#0f172a', border: 'none' }}>
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Mobile header with hamburger */}
        <div className="flex lg:hidden" style={{ background: '#0f172a', height: 48, flexShrink: 0, alignItems: 'center', padding: '0 16px', gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Medaaris</span>
        </div>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
