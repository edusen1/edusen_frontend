'use client';

import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
const B = '#e6ebf1';

const JOURS_MAP: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };

export default function EleveAccueilPage() {
  const { session } = useAuthStore();
  const user = session?.user;
  const [profil, setProfil] = useState<R>({});
  const [edt, setEdt] = useState<R[]>([]);
  const [comms, setComms] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, eRes, cRes] = await Promise.all([
        apiClient.get('/eleve/profil').catch(() => ({ data: {} })),
        apiClient.get('/eleve/emploi-du-temps').catch(() => ({ data: [] })),
        apiClient.get('/eleve/communications').catch(() => ({ data: [] })),
      ]);
      setProfil((pRes.data ?? {}) as R);
      const ed = eRes.data;
      setEdt(Array.isArray(ed) ? ed : Array.isArray((ed as R)?.cours) ? (ed as R).cours as R[] : []);
      const cd = cRes.data;
      setComms(Array.isArray(cd) ? cd : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const firstName = String(profil.firstName ?? user?.prenom ?? '');
  const lastName = String(profil.lastName ?? user?.nom ?? '');
  const fullName = `${firstName} ${lastName}`.trim() || 'Élève';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'E';
  const photoUrl = resolveStorageUrl(profil.photoUrl as string);
  const classeNom = String((profil.classe as R)?.nom ?? '');
  const niveauNom = String(((profil.classe as R)?.niveau as R)?.libelle ?? '');
  const matricule = String(profil.matricule ?? '');
  const ecoleNom = String(profil.ecoleNom ?? '');
  const anneeScolaire = String(profil.anneeAcademique ?? (profil.classe as R)?.anneeAcademique?.libelle ?? '');
  const dateNaissance = profil.dateNaissance ? new Date(String(profil.dateNaissance)).toLocaleDateString('fr-FR') : '';
  const lieuNaissance = String(profil.lieuNaissance ?? '');
  const qrData = JSON.stringify({ id: String(profil.id ?? user?.id ?? ''), m: matricule, t: user?.tenantId ?? '' });

  // Prochain cours
  const now = new Date();
  const todayJour = JOURS_MAP[now.getDay()] ?? '';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayCours = edt.filter((c) => String(c.jourSemaine ?? c.jour ?? '') === todayJour)
    .sort((a, b) => String(a.heureDebut ?? '').localeCompare(String(b.heureDebut ?? '')));
  const prochainCours = todayCours.find((c) => {
    const [h, m] = String(c.heureFin ?? '').split(':').map(Number);
    return (h * 60 + (m || 0)) > nowMin;
  });

  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; } };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* Bonjour */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Bonjour,</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{firstName} 👋</div>
          </div>

          {/* Carte élève — compact */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, marginBottom: '14px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fullName}</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Photo */}
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: `2px solid ${B}`, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: '#0f172a', border: `2px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
              )}
              {/* Infos compactes */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {classeNom && <span style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', border: '1px solid #bfdbfe', padding: '1px 8px', background: '#eff6ff' }}>{classeNom}</span>}
                  {anneeScolaire && <span style={{ fontSize: 10, color: '#475569', border: `1px solid ${B}`, padding: '1px 8px' }}>{anneeScolaire}</span>}
                </div>
                {matricule && <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{matricule}</div>}
                {dateNaissance && <div style={{ fontSize: 10, color: '#94a3b8' }}>Né(e) le {dateNaissance}{lieuNaissance ? ` à ${lieuNaissance}` : ''}</div>}
              </div>
              {/* QR */}
              <div onClick={() => setShowQR(true)} style={{ flexShrink: 0, cursor: 'pointer', textAlign: 'center' }}>
                <QRCodeSVG value={qrData} size={64} level="H" />
                <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>Scanner</div>
              </div>
            </div>
          </div>

          {/* Infos détaillées */}
          <div style={{ background: '#fff', border: `1px solid ${B}`, marginBottom: 14, padding: '10px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6 }}>
              {[
                { label: 'Matricule', value: matricule },
                { label: 'Classe', value: classeNom },
                { label: 'Niveau', value: niveauNom },
                { label: 'Date de naissance', value: dateNaissance },
                { label: 'Lieu de naissance', value: lieuNaissance },
                { label: 'École', value: ecoleNom },
              ].filter((i) => i.value).map((i) => (
                <div key={i.label} style={{ padding: '4px 0' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{i.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginTop: 1 }}>{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prochain cours */}
          {prochainCours && (() => {
            const pcDebut = String(prochainCours.heureDebut ?? '');
            const pcFin = String(prochainCours.heureFin ?? '');
            const pcMat = String((prochainCours.matiere as R)?.libelle ?? prochainCours.matiereLibelle ?? '');
            const pcProf = String(prochainCours.enseignantNom ?? '');
            const pcSalle = String(prochainCours.salleNom ?? '');
            const [dh, dm] = pcDebut.split(':').map(Number);
            const diff = (dh * 60 + (dm || 0)) - nowMin;
            const badge = diff <= 0 ? 'En cours' : diff <= 60 ? `Dans ${diff} min` : '';
            return (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Prochain cours</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: 50, flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{pcDebut}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{pcFin}</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: B, flexShrink: 0 }} />
                  <div style={{ flex: '1 1 100px', minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{pcMat}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{pcProf}{pcSalle ? ` · ${pcSalle}` : ''}</div>
                  </div>
                  {badge && <span style={{ fontSize: 11, fontWeight: 600, color: badge === 'En cours' ? '#16a34a' : '#2563eb', border: `1px solid ${badge === 'En cours' ? '#bbf7d0' : '#bfdbfe'}`, background: badge === 'En cours' ? '#f0fdf4' : '#eff6ff', padding: '3px 10px', flexShrink: 0 }}>{badge}</span>}
                </div>
              </div>
            );
          })()}

          {/* Communications */}
          {comms.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Communications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {comms.map((c) => (
                  <div key={String(c.id)} style={{ background: '#fff', border: `1px solid ${B}`, borderLeft: '3px solid #2563eb', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{String(c.titre ?? '')}</div>
                      <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{f(String(c.envoyeLe ?? c.createdAt ?? ''))}</span>
                    </div>
                    {c.contenu && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{String(c.contenu)}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>

      {/* QR plein écran */}
      {showQR && (
        <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>{ecoleNom || 'Carte élève'}</div>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${B}`, marginBottom: 12 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{initials}</div>
          )}
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{fullName}</div>
          {classeNom && <div style={{ fontSize: 14, color: '#2563eb', fontWeight: 600, marginBottom: 2 }}>{classeNom}</div>}
          {matricule && <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginBottom: 20 }}>{matricule}</div>}
          <QRCodeSVG value={qrData} size={220} level="H" />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 20 }}>Toucher pour fermer</div>
        </div>
      )}
    </div>
  );
}
