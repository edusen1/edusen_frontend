'use client';

import { MesEmprunts } from '@/components/bibliotheque/mes-emprunts';

export default function EleveBibliothequePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Bibliothèque</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Mes emprunts et mon historique</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
        <MesEmprunts />
      </div>
    </div>
  );
}
