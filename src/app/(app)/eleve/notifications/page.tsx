'use client';

import { useEleveNotifications, useToutLireNotifications, useMarquerNotificationLue } from '@/hooks/use-query-api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATIC_NOTIFICATIONS = [
  {
    id: '1', lu: false,
    titre: 'Nouvelle note publiée',
    contenu: 'Mathématiques : 16,5/20 — Devoir surveillé.',
    date: 'Il y a 1 h',
    iconBg: '#2563eb', iconStroke: '#fff',
    icon: 'book',
  },
  {
    id: '2', lu: true,
    titre: 'Annonce — Conseil de classe',
    contenu: 'Bulletins du T2 disponibles dès le 28 mars.',
    date: 'Hier · 16:20',
    iconBg: '#fef3c7', iconStroke: '#d97706',
    icon: 'monitor',
  },
  {
    id: '3', lu: true,
    titre: 'Réclamation traitée',
    contenu: 'Votre absence du 3 mars a été régularisée.',
    date: '12 mars',
    iconBg: '#dcfce7', iconStroke: '#16a34a',
    icon: 'check',
  },
  {
    id: '4', lu: true,
    titre: 'Absence enregistrée',
    contenu: 'SVT du 3 mars — non justifiée.',
    date: '3 mars',
    iconBg: '#fee2e2', iconStroke: '#dc2626',
    icon: 'alert',
  },
];

function NotifIcon({ icon, bg, stroke }: { icon: string; bg: string; stroke: string }) {
  return (
    <span style={{ width: 38, height: 38, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon === 'book' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )}
      {icon === 'monitor' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h20v14H2zM8 21h8M12 17v4"/>
        </svg>
      )}
      {icon === 'check' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      )}
      {icon === 'alert' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <path d="M12 9v4M12 17h.01"/>
        </svg>
      )}
      {icon === 'bell' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
      )}
    </span>
  );
}

export default function NotificationsPage() {
  const { data, isLoading } = useEleveNotifications();
  const toutLire = useToutLireNotifications();
  const marquerLue = useMarquerNotificationLue();

  const notifications = Array.isArray(data) ? data : (data?.notifications ?? []);

  const items = notifications.length > 0
    ? (notifications as Record<string, unknown>[]).map((n) => {
        let date = '';
        try {
          if (n.createdAt) date = formatDistanceToNow(new Date(n.createdAt as string), { addSuffix: true, locale: fr });
        } catch { /* skip */ }
        return { id: n.id as string, lu: n.lu as boolean, titre: n.titre as string, contenu: n.contenu as string, date, iconBg: '#dbeafe', iconStroke: '#2563eb', icon: 'bell' };
      })
    : STATIC_NOTIFICATIONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Notifications</div>
        <button
          onClick={() => toutLire.mutate()}
          style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Tout lire
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id ?? idx}
              onClick={() => !item.lu && marquerLue.mutate(item.id)}
              style={{ display: 'flex', gap: 12, padding: '14px 20px', background: !item.lu ? '#eff6ff' : '#fff', borderBottom: '1px solid #eef2f6', cursor: !item.lu ? 'pointer' : 'default' }}
            >
              <NotifIcon icon={item.icon} bg={item.iconBg} stroke={item.iconStroke} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.titre}</div>
                {item.contenu && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>{item.contenu}</div>}
                {item.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{item.date}</div>}
              </div>
              {!item.lu && <span style={{ width: 7, height: 7, background: '#2563eb', flexShrink: 0, marginTop: 6, borderRadius: 0 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
