'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type R = Record<string, unknown>;
const B = '#e6ebf1';

type Classe = R & { id: string; nom: string; nbEleves?: number; moyenne?: number; niveau?: { nom?: string } };
type Cours = R & { heureDebut?: string; heureFin?: string; jourSemaine?: string; classe?: { nom?: string }; matiere?: { libelle?: string }; salle?: { nom?: string } };

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 4 }} /></div>;
}

const JOURS: Record<string, string> = { LUNDI: 'Lun', MARDI: 'Mar', MERCREDI: 'Mer', JEUDI: 'Jeu', VENDREDI: 'Ven', SAMEDI: 'Sam' };

export default function ProfDashboardPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [edt, setEdt] = useState<Cours[]>([]);
  const [absences, setAbsences] = useState<R[]>([]);
  const [reclamations, setReclamations] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/professeur/mes-classes').catch(() => ({ data: [] })),
      apiClient.get('/professeur/emploi-du-temps').catch(() => ({ data: [] })),
      apiClient.get('/professeur/absences').catch(() => ({ data: [] })),
      apiClient.get('/professeur/reclamations').catch(() => ({ data: [] })),
    ]).then(([cRes, eRes, aRes, rRes]) => {
      const parseList = (d: unknown) => { if (Array.isArray(d)) return d; const o = d as R; return Array.isArray(o?.data) ? o.data : Array.isArray(o?.content) ? o.content : []; };
      setClasses(parseList(cRes.data) as Classe[]);
      setEdt(parseList(eRes.data) as Cours[]);
      setAbsences(parseList(aRes.data) as R[]);
      setReclamations(parseList(rRes.data) as R[]);
    }).finally(() => setLoading(false));
  }, []);

  const nbClasses = classes.length;
  const totalEleves = classes.reduce((s, c) => s + Number(c.nbEleves ?? (c as R).effectif ?? 0), 0);
  const moyennes = classes.map((c) => Number(c.moyenne ?? 0)).filter((m) => m > 0);
  const moyenneGlobale = moyennes.length > 0 ? moyennes.reduce((s, m) => s + m, 0) / moyennes.length : 0;
  const totalHeures = edt.length;
  const absEnAttente = absences.filter((a) => a.statut === 'EN_ATTENTE').length;
  const reclamEnAttente = reclamations.filter((r) => r.statut === 'EN_ATTENTE').length;

  const jourMap: Record<number, string> = { 1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI' };
  const todayJour = jourMap[new Date().getDay()] ?? '';
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const coursAujourdhui = edt.filter((c) => String(c.jourSemaine) === todayJour).sort((a, b) => String(a.heureDebut ?? '').localeCompare(String(b.heureDebut ?? '')));
  const prochainCours = coursAujourdhui.find((c) => String(c.heureFin ?? '') > nowTime);
  const today = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tableau de bord</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{today}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Mes classes', value: nbClasses, color: '#2563eb' },
            { label: 'Total élèves', value: totalEleves, color: '#7c3aed' },
            { label: 'Moyenne', value: moyenneGlobale > 0 ? `${moyenneGlobale.toFixed(1)}/20` : '—', color: moyenneGlobale >= 10 ? '#16a34a' : '#dc2626' },
            { label: 'Cours/sem.', value: totalHeures, color: '#0891b2' },
            { label: 'Réclamations', value: reclamEnAttente, color: reclamEnAttente > 0 ? '#d97706' : '#16a34a' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', border: `1px solid ${B}`, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Prochain cours + alertes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Prochain cours</div>
            {prochainCours ? (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                  {String((prochainCours.matiere as R)?.libelle ?? (prochainCours as R).matiereLibelle ?? '—')}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  {String((prochainCours.classe as R)?.nom ?? (prochainCours as R).classeNom ?? '—')} · {String(prochainCours.heureDebut ?? '')} — {String(prochainCours.heureFin ?? '')}
                </div>
                {Boolean((prochainCours.salle as R)?.nom ?? (prochainCours as R).salleNom) && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Salle : {String((prochainCours.salle as R)?.nom ?? (prochainCours as R).salleNom)}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: 10, textAlign: 'center' }}>
                {coursAujourdhui.length > 0 ? 'Tous les cours du jour sont terminés' : 'Pas de cours aujourd\'hui'}
              </div>
            )}
            {coursAujourdhui.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
                {coursAujourdhui.length} cours aujourd&apos;hui · {coursAujourdhui.filter((c) => String(c.heureFin ?? '') <= nowTime).length} terminé(s)
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Notifications</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {absEnAttente > 0 && (
                <Link href="/professeur/absences" style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', fontSize: 12, color: '#92400e', textDecoration: 'none', display: 'block' }}>
                  {absEnAttente} absence(s) en attente
                </Link>
              )}
              {reclamEnAttente > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', fontSize: 12, color: '#dc2626' }}>
                  {reclamEnAttente} réclamation(s) à traiter
                </div>
              )}
              {absEnAttente === 0 && reclamEnAttente === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: 10, textAlign: 'center' }}>Aucune notification</div>
              )}
            </div>
          </div>
        </div>

        {/* Classes */}
        <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Mes classes</div>
            <Link href="/professeur/mes-classes" style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Voir tout</Link>
          </div>
          {classes.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 16 }}>Aucune classe assignée</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {classes.map((c) => {
                const moy = Number(c.moyenne ?? 0);
                const nb = Number(c.nbEleves ?? (c as R).effectif ?? 0);
                const moyColor = moy >= 12 ? '#16a34a' : moy >= 10 ? '#d97706' : moy > 0 ? '#dc2626' : '#94a3b8';
                return (
                  <Link key={c.id} href={`/professeur/classe/${c.id}`} style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: '10px 12px', textDecoration: 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.nom}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{String((c.niveau as R)?.nom ?? '')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>{nb} él.</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: moyColor }}>{moy > 0 ? `${moy.toFixed(1)}` : '—'}</span>
                    </div>
                    {moy > 0 && <div style={{ marginTop: 4 }}><Bar value={moy} max={20} color={moyColor} /></div>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Cours du jour */}
        {coursAujourdhui.length > 0 && (
          <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Cours du jour — {JOURS[todayJour] ?? todayJour}</div>
              <Link href="/professeur/emploi-du-temps" style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Semaine</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {coursAujourdhui.map((c, i) => {
                const done = String(c.heureFin ?? '') <= nowTime;
                const current = !done && String(c.heureDebut ?? '') <= nowTime;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: current ? '#eff6ff' : done ? '#f8fafc' : '#fff', border: `1px solid ${current ? '#bfdbfe' : '#f1f5f9'}`, opacity: done ? 0.6 : 1, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: current ? '#2563eb' : '#475569', fontFamily: 'monospace', flexShrink: 0 }}>
                      {String(c.heureDebut ?? '')}–{String(c.heureFin ?? '')}
                    </div>
                    <div style={{ flex: '1 1 100px', minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{String((c.matiere as R)?.libelle ?? (c as R).matiereLibelle ?? '—')}</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{String((c.classe as R)?.nom ?? (c as R).classeNom ?? '')}</span>
                    </div>
                    {current && <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', padding: '1px 6px', background: '#dbeafe' }}>EN COURS</span>}
                    {done && <span style={{ fontSize: 9, color: '#94a3b8' }}>Terminé</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Accès rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {[
            { label: 'Mes classes', href: '/professeur/mes-classes', color: '#2563eb' },
            { label: 'Emploi du temps', href: '/professeur/emploi-du-temps', color: '#0891b2' },
            { label: 'Déclarer absence', href: '/professeur/absences', color: '#d97706' },
          ].map((a) => (
            <Link key={a.label} href={a.href} style={{ background: '#fff', border: `1px solid ${B}`, padding: '10px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
