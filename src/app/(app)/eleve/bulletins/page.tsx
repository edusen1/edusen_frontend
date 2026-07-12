'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
const B = '#e6ebf1';

const PERIODE_LABELS: Record<string, string> = {
  TRIMESTRE_1: 'Trimestre 1', TRIMESTRE_2: 'Trimestre 2', TRIMESTRE_3: 'Trimestre 3',
  SEMESTRE_1: 'Semestre 1', SEMESTRE_2: 'Semestre 2',
};

function fmtRang(r: number) { return r === 1 ? '1er' : `${r}ème`; }

export default function EleveBulletinsPage() {
  const [bulletins, setBulletins] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBulletins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/eleve/bulletins');
      const d = res.data;
      setBulletins(Array.isArray(d) ? d : Array.isArray((d as R)?.bulletins) ? (d as R).bulletins as R[] : Array.isArray((d as R)?.data) ? (d as R).data as R[] : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchBulletins(); }, [fetchBulletins]);

  async function openBulletin(id: string) {
    try {
      const res = await apiClient.get(`/eleve/bulletins/${id}/export`);
      const data = (res.data ?? {}) as R;
      const pdfUrl = String(data.fichierPdfUrl ?? data.url ?? '');
      if (!pdfUrl) { toast.error('Bulletin non disponible'); return; }
      window.open(resolveStorageUrl(pdfUrl), '_blank');
    } catch { toast.error('Erreur lors de la génération du bulletin'); }
  }

  async function downloadBulletin(id: string, trimestre: string) {
    try {
      const res = await apiClient.get(`/eleve/bulletins/${id}/export`);
      const data = (res.data ?? {}) as R;
      const pdfUrl = String(data.fichierPdfUrl ?? data.url ?? '');
      if (!pdfUrl) { toast.error('Bulletin non disponible'); return; }
      const link = document.createElement('a');
      link.href = resolveStorageUrl(pdfUrl);
      link.setAttribute('download', `bulletin-${trimestre}.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { toast.error('Erreur lors du téléchargement'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes bulletins</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : bulletins.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun bulletin disponible</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bulletins.map((b) => {
              const id = String(b.id ?? '');
              const trimestre = String(b.trimestre ?? '');
              const moyenne = b.moyenne as number | undefined;
              const rang = b.rang as number | undefined;
              const annee = String(b.anneeScolaire ?? '');
              const appreciation = b.appreciation as string | undefined;
              const moyColor = moyenne != null ? (moyenne >= 14 ? '#16a34a' : moyenne >= 10 ? '#d97706' : '#dc2626') : '#94a3b8';

              return (
                <div key={id} style={{ background: '#fff', border: `1px solid ${B}`, padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{PERIODE_LABELS[trimestre] ?? trimestre}</div>
                      {annee && <div style={{ fontSize: 11, color: '#94a3b8' }}>{annee}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => void openBulletin(id)}
                        style={{ height: 32, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Ouvrir
                      </button>
                      <button onClick={() => void downloadBulletin(id, trimestre)}
                        style={{ height: 32, padding: '0 12px', border: `1px solid ${B}`, background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        PDF
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Moyenne</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: moyColor }}>{moyenne != null ? moyenne.toFixed(2) : '—'}<span style={{ fontSize: 11, color: '#94a3b8' }}>/20</span></div>
                    </div>
                    {rang != null && (
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Rang</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{fmtRang(rang)}</div>
                      </div>
                    )}
                  </div>
                  {appreciation && <div style={{ marginTop: 8, fontSize: 11, color: '#475569', fontStyle: 'italic', padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>{appreciation}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
