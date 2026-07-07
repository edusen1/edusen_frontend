'use client';

import { useEleveBulletins } from '@/hooks/use-query-api';
import { eleveApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';

async function downloadBulletin(id: string, trimestre?: string) {
  try {
    const res = await eleveApi.exportBulletin(id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bulletin-${trimestre ?? id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error('Erreur lors du téléchargement');
  }
}

export default function BulletinsPage() {
  const { data, isLoading } = useEleveBulletins();
  const bulletins = Array.isArray(data) ? data : (data?.bulletins ?? []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 14px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Bulletins</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, border: '1px solid #d9e0e8', padding: '8px 12px', background: '#f8fafc' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Année 2025–2026</span>
          <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Actuelle</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : bulletins.length === 0 ? (
          <>
            {/* Static fallback showing current year bulletin cards */}
            <BulletinCard
              label="Trimestre 1"
              status="published"
              moyenne="14,2"
              rang="4ᵉ"
              onDownload={() => {}}
            />
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6, marginBottom: 10 }}>
              <span style={{ width: 38, height: 38, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Trimestre 2</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Disponible après le 28 mars</div>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>À venir</span>
            </div>
          </>
        ) : (
          (bulletins as Record<string, unknown>[]).map((b) => {
            const id = b.id as string;
            const trimestre = b.trimestre as string | undefined;
            const moyenne = b.moyenneGenerale as number | undefined;
            const rang = b.rang as number | undefined;
            const statut = b.statut as string | undefined;
            return (
              <BulletinCard
                key={id}
                label={trimestre ? `Trimestre ${trimestre}` : 'Bulletin'}
                status={statut === 'PUBLISHED' ? 'published' : 'upcoming'}
                moyenne={moyenne !== undefined ? String(moyenne.toFixed(1)).replace('.', ',') : undefined}
                rang={rang !== undefined ? `${rang}ᵉ` : undefined}
                onDownload={() => downloadBulletin(id, trimestre)}
              />
            );
          })
        )}

        {/* Previous years */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', margin: '18px 0 10px' }}>Années précédentes</div>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          {[
            { year: '2024–2025 · 4ᵉ B', sub: '3 bulletins · Moy. 13,6' },
            { year: '2023–2024 · 5ᵉ A', sub: '3 bulletins · Moy. 13,1' },
          ].map((item) => (
            <div key={item.year} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: '1px solid #eef2f6' }}>
              <span style={{ width: 34, height: 34, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.year}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sub}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BulletinCard({ label, status, moyenne, rang, onDownload }: {
  label: string;
  status: 'published' | 'upcoming';
  moyenne?: string;
  rang?: string;
  onDownload: () => void;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e6ebf1', display: 'flex', marginBottom: 14 }}>
      <div style={{ width: 96, flexShrink: 0, background: '#f1f5f9', borderRight: '1px solid #e6ebf1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>PDF · 2 p.</span>
      </div>
      <div style={{ padding: 14, flex: 1 }}>
        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, color: status === 'published' ? '#16a34a' : '#94a3b8', background: status === 'published' ? '#dcfce7' : '#f1f5f9', padding: '3px 8px' }}>
          {status === 'published' ? 'PUBLIÉ' : 'À VENIR'}
        </span>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>{label}</div>
        {(moyenne || rang) && (
          <div style={{ display: 'flex', gap: 18, marginTop: 9 }}>
            {moyenne && <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Moyenne</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{moyenne}</div></div>}
            {rang && <div><div style={{ fontSize: 10, color: '#94a3b8' }}>Rang</div><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{rang}</div></div>}
          </div>
        )}
        {status === 'published' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={onDownload}
              style={{ flex: 1, height: 36, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              PDF
            </button>
            <button style={{ width: 36, height: 36, border: '1px solid #d9e0e8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
