'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useEleveNotes, useEleveAbsences, useEleveEmploiDuTemps, useEleveNotifications, useEleveProfil } from '@/hooks/use-query-api';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOURS_COURT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function getNoteColor(val: number) {
  if (val >= 14) return '#16a34a';
  if (val >= 10) return '#0f172a';
  return '#dc2626';
}

export default function EleveAccueilPage() {
  const { session } = useAuthStore();
  const user = session?.user;
  const nomComplet = ((user?.prenom ?? '') + ' ' + (user?.nom ?? '')).trim() || 'Élève';
  const initials = ((user?.prenom?.[0] ?? '') + (user?.nom?.[0] ?? '')).toUpperCase() || 'E';

  const { data: profilData } = useEleveProfil();
  const { data: notesData } = useEleveNotes();
  const { data: absencesData } = useEleveAbsences();
  const { data: emploiData } = useEleveEmploiDuTemps();
  const { data: notifsData } = useEleveNotifications();

  const profil = (profilData ?? {}) as Record<string, unknown>;
  const classeObj = profil.classe as Record<string, unknown> | undefined;
  const classeNom = (classeObj?.nom ?? '3ᵉ B') as string;

  // Stats
  const notesObj = (Array.isArray(notesData) ? {} : (notesData ?? {})) as Record<string, unknown>;
  const moyenne = notesObj.moyenneGenerale as number | undefined;
  const rang = notesObj.rang as number | undefined;
  const moyenneStr = moyenne != null ? String(moyenne).replace('.', ',') : '—';
  const rangStr = rang != null ? `${rang}ᵉ` : '—';

  const absencesRaw = Array.isArray(absencesData) ? absencesData : ((absencesData as Record<string, unknown> | null)?.absences ?? []);
  const absencesCount = (absencesRaw as unknown[]).length;

  // Last 2 notes
  const allNotes = (notesObj.notes as Record<string, unknown>[] | undefined) ?? [];
  const lastNotes = allNotes.slice(0, 2);

  // Next cours from emploi du temps
  const today = new Date();
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const coursRaw = Array.isArray(emploiData) ? emploiData : ((emploiData as Record<string, unknown> | null)?.cours ?? []);
  const sortedCours = (coursRaw as Record<string, unknown>[]).filter((c) => {
    const jour = c.jour as string | undefined;
    if (!jour) return false;
    const jourIdx = JOURS.findIndex((j) => j.toLowerCase() === jour.toLowerCase())
      || JOURS_COURT.findIndex((j) => j.toLowerCase() === jour.toLowerCase());
    const todayIdx = today.getDay();
    if (jourIdx < 0) return false;
    if (jourIdx > todayIdx) return true;
    if (jourIdx === todayIdx) {
      const hd = c.heureDebut as string | undefined;
      if (!hd) return false;
      const [h, m] = hd.split(':').map(Number);
      return (h * 60 + (m || 0)) > nowMin;
    }
    return false;
  });
  const prochainCours = sortedCours[0] as Record<string, unknown> | undefined;
  const pcMatiere = prochainCours?.matiere as Record<string, unknown> | string | undefined;
  const pcMatiereNom = (typeof pcMatiere === 'string' ? pcMatiere : (pcMatiere as Record<string, unknown>)?.nom as string) ?? 'Français';
  const pcHeure = (prochainCours?.heureDebut as string | undefined) ?? '10:00';
  const pcSalle = (prochainCours?.salle as Record<string, unknown> | undefined)?.nom as string
    ?? (prochainCours?.salleNom as string | undefined) ?? 'Salle A04';
  const pcEnseignant = (prochainCours?.enseignant as Record<string, unknown> | undefined)
    ? `${((prochainCours?.enseignant as Record<string, unknown>)?.prenom as string ?? '')} ${((prochainCours?.enseignant as Record<string, unknown>)?.nom as string ?? '')}`.trim()
    : 'Enseignant';

  // Notifications (unread count + first annonce)
  const notifsRaw = Array.isArray(notifsData) ? notifsData : ((notifsData as Record<string, unknown> | null)?.notifications ?? []);
  const unreadCount = (notifsRaw as Record<string, unknown>[]).filter((n) => !n.lu).length;
  const firstNotif = (notifsRaw as Record<string, unknown>[])[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Blue header */}
      <div style={{ background: '#2563eb', padding: '18px 20px 22px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,.25)', border: '2px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#bfdbfe' }}>Bonjour,</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{nomComplet}</div>
            <div style={{ fontSize: 11, color: '#bfdbfe', marginTop: 1 }}>{classeNom} · Année 2025–2026</div>
          </div>
          <Link href="/eleve/notifications" style={{ width: 38, height: 38, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', textDecoration: 'none' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, background: '#f87171', border: '1.5px solid #2563eb', borderRadius: '50%' }} />}
          </Link>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', padding: '11px 12px' }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>{moyenneStr}</div>
            <div style={{ fontSize: 11, color: '#bfdbfe' }}>Moyenne</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', padding: '11px 12px' }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>{rangStr}</div>
            <div style={{ fontSize: 11, color: '#bfdbfe' }}>Rang</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.12)', padding: '11px 12px' }}>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff' }}>{absencesCount}</div>
            <div style={{ fontSize: 11, color: '#bfdbfe' }}>Absences</div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
        {/* Prochain cours */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 9 }}>Prochain cours</div>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', borderLeft: '3px solid #2563eb', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{pcHeure}</div>
          </div>
          <div style={{ width: 1, height: 34, background: '#e6ebf1' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{pcMatiereNom}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{pcEnseignant} · {pcSalle}</div>
          </div>
          <Link href="/eleve/emploi-du-temps" style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '4px 8px', textDecoration: 'none' }}>Voir EDT</Link>
        </div>

        {/* Dernières notes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 9px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>Dernières notes</span>
          <Link href="/eleve/notes" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Tout voir</Link>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          {lastNotes.length > 0 ? lastNotes.map((n, idx) => {
            const mat = n.matiere as Record<string, unknown> | string | undefined;
            const matNom = (typeof mat === 'string' ? mat : (mat as Record<string, unknown>)?.nom as string) ?? 'Matière';
            const valeur = n.valeur as number | undefined;
            const type = n.typeEvaluation as string | undefined;
            const dateStr = n.date as string | undefined;
            let dateLabel = '';
            try { if (dateStr) dateLabel = new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); } catch { /* skip */ }
            return (
              <div key={String(n.id ?? idx)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: idx < lastNotes.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                <span style={{ width: 34, height: 34, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{matNom}</div>
                  {(type || dateLabel) && <div style={{ fontSize: 11, color: '#94a3b8' }}>{[type, dateLabel].filter(Boolean).join(' · ')}</div>}
                </div>
                {valeur != null && <div style={{ fontSize: 16, fontWeight: 700, color: getNoteColor(valeur) }}>{String(valeur).replace('.', ',')}</div>}
              </div>
            );
          }) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid #eef2f6' }}>
                <span style={{ width: 34, height: 34, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Mathématiques</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Devoir · 18 mars</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>16,5</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <span style={{ width: 34, height: 34, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Français</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Composition · 14 mars</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>13,0</div>
              </div>
            </>
          )}
        </div>

        {/* Annonce / dernière notification */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', margin: '20px 0 9px' }}>Dernière notification</div>
        {firstNotif ? (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #d97706', padding: '12px 13px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{firstNotif.titre as string}</div>
            {firstNotif.contenu && <div style={{ fontSize: 12, color: '#a16207', marginTop: 3, lineHeight: 1.45 }}>{firstNotif.contenu as string}</div>}
          </div>
        ) : (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #d97706', padding: '12px 13px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Conseil de classe — Trimestre 2</div>
            <div style={{ fontSize: 12, color: '#a16207', marginTop: 3, lineHeight: 1.45 }}>Les bulletins seront disponibles à partir du 28 mars.</div>
          </div>
        )}

        {/* Shortcuts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
          <Link href="/eleve/bulletins" style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Bulletins</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Mes résultats</div>
            </div>
          </Link>
          <Link href="/eleve/reclamations" style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Réclamations</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Mes demandes</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
