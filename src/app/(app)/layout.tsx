'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useAuthStore } from '@/stores/auth-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  const isMobileOnly = user?.role === 'ELEVE' || user?.role === 'PARENT';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f7fa' }}>
      {/* Desktop sidebar — all roles */}
      <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
        <AppSidebar />
      </div>

      {/* Mobile sidebar via Sheet — admin/prof roles only */}
      {!isMobileOnly && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" style={{ padding: 0, width: 264, background: '#0f172a', border: 'none' }}>
            <AppSidebar onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: isMobileOnly ? 64 : 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav for ELEVE/PARENT — mobile only */}
      {isMobileOnly && <BottomNav />}
    </div>
  );
}
