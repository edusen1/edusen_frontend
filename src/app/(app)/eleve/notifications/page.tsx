'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';

export default function EleveNotificationsPage() {
  const [notifs, setNotifs] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/eleve/notifications');
      const d = res.data;
      setNotifs(Array.isArray(d) ? d : Array.isArray((d as R)?.notifications) ? (d as R).notifications as R[] : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchNotifs(); }, [fetchNotifs]);

  async function marquerLue(id: string) {
    try { await apiClient.patch(`/eleve/notifications/${id}/lire`); setNotifs((prev) => prev.map((n) => String(n.id) === id ? { ...n, lue: true, lu: true } : n)); } catch { /* ignore */ }
  }

  async function toutLire() {
    try { await apiClient.post('/eleve/notifications/tout-lire'); setNotifs((prev) => prev.map((n) => ({ ...n, lue: true, lu: true }))); toast.success('Tout marqué comme lu'); } catch { /* ignore */ }
  }

  const unread = notifs.filter((n) => !n.lu && !n.lue).length;
  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Notifications</div>
        {unread > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>{unread}</span>}
        {unread > 0 && <button onClick={() => void toutLire()} style={{ marginLeft: 'auto', fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Tout marquer comme lu</button>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : notifs.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune notification</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {notifs.map((n) => {
              const isRead = !!(n.lu || n.lue);
              return (
                <div key={String(n.id)} onClick={() => !isRead && void marquerLue(String(n.id))}
                  style={{ background: isRead ? '#fff' : '#eff6ff', border: `1px solid ${isRead ? B : '#bfdbfe'}`, padding: '12px 14px', cursor: isRead ? 'default' : 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {!isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 5, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isRead ? 500 : 700, color: '#0f172a' }}>{String(n.titre ?? '')}</div>
                      {Boolean(n.message) && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>{String(n.message ?? n.contenu ?? '')}</div>}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{f(String(n.createdAt ?? ''))}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
