'use client';

import { toast } from 'sonner';
import { useParentNotifications, useMarquerNotificationLueParent, useToutLireNotificationsParent } from '@/hooks/use-query-api';

const TYPE_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  note: { icon: '📊', bg: '#eff6ff', color: '#2563eb' },
  absence: { icon: '⚠️', bg: '#fef3c7', color: '#d97706' },
  paiement: { icon: '💳', bg: '#fee2e2', color: '#dc2626' },
  bulletin: { icon: '📄', bg: '#f5f3ff', color: '#7c3aed' },
  annonce: { icon: '📢', bg: '#dcfce7', color: '#16a34a' },
};

export default function ParentNotificationsPage() {
  const { data, isLoading } = useParentNotifications();
  const rawList = Array.isArray(data) ? data : ((data as Record<string, unknown> | null)?.notifications ?? (data as Record<string, unknown> | null)?.data ?? []);
  const notifs = rawList as Record<string, unknown>[];

  const marquerLue = useMarquerNotificationLueParent();
  const toutLire = useToutLireNotificationsParent();

  const nbNonLues = (notifs as Record<string, unknown>[]).filter((n) => !n.lu).length;

  const handleMarquerLue = async (id: string) => {
    try {
      await marquerLue.mutateAsync(id);
    } catch {
      // silent
    }
  };

  const handleToutLire = async () => {
    try {
      await toutLire.mutateAsync();
      toast.success('Toutes les notifications sont marquées comme lues');
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#2563eb', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>Notifications</div>
          {nbNonLues > 0 && <div style={{ fontSize: 12, color: '#bfdbfe' }}>{nbNonLues} non lue{nbNonLues > 1 ? 's' : ''}</div>}
        </div>
        {nbNonLues > 0 && (
          <button onClick={handleToutLire} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Chargement…</div>
        )}
        {!isLoading && notifs.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Aucune notification.
          </div>
        )}
        {!isLoading && notifs.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          {notifs.map((n, idx) => {
            const type = (n.type ?? 'annonce') as string;
            const ti = TYPE_ICONS[type] ?? TYPE_ICONS.annonce;
            const lu = !!n.lu;
            const id = String(n.id ?? idx);
            return (
              <div
                key={id}
                onClick={() => !lu && handleMarquerLue(id)}
                style={{ display: 'flex', gap: 14, padding: '15px 18px', borderBottom: idx < (notifs as Record<string, unknown>[]).length - 1 ? '1px solid #eef2f6' : 'none', background: lu ? '#fff' : '#f8faff', cursor: lu ? 'default' : 'pointer', alignItems: 'flex-start' }}
              >
                <div style={{ width: 42, height: 42, background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {ti.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: lu ? 500 : 700, color: '#0f172a' }}>{(n.titre ?? '') as string}</span>
                    {!lu && <span style={{ width: 8, height: 8, background: '#2563eb', borderRadius: '50%', display: 'inline-block' }} />}
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{(n.message ?? '') as string}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{(n.date ?? '') as string}</div>
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
