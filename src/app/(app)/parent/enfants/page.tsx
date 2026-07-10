'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useParentEnfants,
  useParentEnfantNotes,
  useParentEnfantAbsences,
  useParentEnfantEmploiDuTemps,
  useParentPaiements,
} from '@/hooks/use-query-api';

type TabKey = 'notes' | 'absences' | 'planning' | 'paiements';

const NOTE_COLORS = [
  { bg: '#eff6ff', stroke: '#2563eb' },
  { bg: '#f5f3ff', stroke: '#7c3aed' },
  { bg: '#ecfdf5', stroke: '#059669' },
  { bg: '#fffbeb', stroke: '#d97706' },
  { bg: '#fef2f2', stroke: '#e11d48' },
];

export default function EnfantsPage() {
  const { session } = useAuthStore();
  const user = session?.user;
  const nomParent = ((user?.prenom ?? '') + ' ' + (user?.nom ?? '')).trim() || 'Parent';

  const { data: enfantsData, isLoading: loadingEnfants } = useParentEnfants();
  const enfants = (Array.isArray(enfantsData) ? enfantsData : []) as Record<string, unknown>[];

  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('notes');

  useEffect(() => {
    if (enfants.length > 0 && !selectedId) {
      setSelectedId(String(enfants[0].id ?? ''));
    }
  }, [enfants, selectedId]);

  const enfant = enfants.find((e) => String(e.id) === selectedId) ?? enfants[0];

  const classeObj = enfant?.classe as Record<string, unknown> | undefined;
  const classeNom = (classeObj?.nom ?? '') as string;
  const prenom = (enfant?.prenom ?? '') as string;
  const nom = (enfant?.nom ?? '') as string;
  const moyenne = (enfant?.moyenne ?? null) as number | null;
  const rang = (enfant?.rang ?? '—') as number | string;
  const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || '?';

  const { data: notesData, isLoading: loadingNotes } = useParentEnfantNotes(selectedId, 'T1');
  const notes = (Array.isArray(notesData) ? notesData : ((notesData as Record<string, unknown> | null)?.notes ?? (notesData as Record<string, unknown> | null)?.matieres ?? [])) as Record<string, unknown>[];

  const { data: absencesData, isLoading: loadingAbsences } = useParentEnfantAbsences(selectedId);
  const absences = (Array.isArray(absencesData) ? absencesData : ((absencesData as Record<string, unknown> | null)?.absences ?? [])) as Record<string, unknown>[];

  const { data: planningData } = useParentEnfantEmploiDuTemps(selectedId);
  const { data: paiementsData, isLoading: loadingPaiements } = useParentPaiements();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'notes', label: 'Notes' },
    { key: 'absences', label: 'Absences' },
    { key: 'planning', label: 'Planning' },
    { key: 'paiements', label: 'Paiements' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Blue header */}
      <div style={{ background: '#2563eb', padding: '16px 20px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Espace parent</div>
          <button style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{nomParent} · {enfants.length} enfant{enfants.length > 1 ? 's' : ''} scolarisé{enfants.length > 1 ? 's' : ''}</div>

        {/* Enfant selector */}
        {enfants.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {(enfants as Record<string, unknown>[]).map((e) => {
              const ep = (e.prenom ?? '') as string;
              const en = (e.nom ?? '') as string;
              const eid = String(e.id);
              const isActive = eid === selectedId;
              return (
                <button
                  key={eid}
                  onClick={() => { setSelectedId(eid); setActiveTab('notes'); }}
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    border: isActive ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {ep} {en[0]}.
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Enfant cards list (accueil view) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingEnfants && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Chargement…</div>
        )}
        {!loadingEnfants && enfants.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Aucun enfant inscrit.</div>
        )}
        {/* Selected child summary */}
        {!loadingEnfants && enfants.length > 0 && (
        <div style={{ background: '#0f172a', margin: '16px 16px 0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{prenom} {nom}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{classeNom}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {typeof moyenne === 'number' ? moyenne.toFixed(1).replace('.', ',') : moyenne}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>/20</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Rang {rang}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', display: 'flex', margin: '0 16px' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '11px 0',
                fontSize: 12,
                fontWeight: activeTab === t.key ? 600 : 500,
                color: activeTab === t.key ? '#2563eb' : '#94a3b8',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '14px 16px' }}>
          {activeTab === 'notes' && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              {loadingNotes && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chargement…</div>}
              {!loadingNotes && notes.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune note disponible.</div>}
              {notes.map((n, idx) => {
                const matiereObj = n.matiere as Record<string, unknown> | undefined;
                const nomMat = (matiereObj?.nom ?? n.nom ?? 'Matière') as string;
                const coef = (matiereObj?.coefficient ?? n.coef ?? n.coefficient ?? 1) as number;
                const noteVal = (n.valeur ?? n.note ?? 0) as number;
                const color = NOTE_COLORS[idx % NOTE_COLORS.length];
                const noteColor = noteVal >= 14 ? '#16a34a' : noteVal >= 10 ? '#0f172a' : '#dc2626';
                return (
                  <div
                    key={`${nomMat}-${idx}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: idx < notes.length - 1 ? '1px solid #eef2f6' : 'none' }}
                  >
                    <div style={{ width: 34, height: 34, background: color.bg, borderLeft: `3px solid ${color.stroke}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{nomMat}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>coef. {coef}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: noteColor }}>
                      {typeof noteVal === 'number' ? noteVal.toFixed(1).replace('.', ',') : noteVal}
                    </div>
                  </div>
                );
              })}
              <button style={{ width: '100%', padding: '12px 0', fontSize: 13, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: 'none', borderTop: '1px solid #e6ebf1', cursor: 'pointer', fontFamily: 'inherit' }}>
                Voir le bulletin complet
              </button>
            </div>
          )}

          {activeTab === 'absences' && (
            <div>
              {loadingAbsences && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chargement…</div>}
              {!loadingAbsences && absences.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Aucune absence enregistrée.
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                  {absences.map((abs, idx) => {
                    const statut = (abs.statut ?? 'non_justifie') as string;
                    const isJust = statut === 'justifie' || statut === 'JUSTIFIE';
                    const isRetard = statut === 'retard' || statut === 'RETARD';
                    const borderColor = isJust ? '#16a34a' : isRetard ? '#d97706' : '#dc2626';
                    const badgeBg = isJust ? '#ecfdf5' : isRetard ? '#fffbeb' : '#fef2f2';
                    const badgeColor = isJust ? '#16a34a' : isRetard ? '#d97706' : '#dc2626';
                    const badgeLabel = isJust ? 'Justifiée' : isRetard ? 'Retard' : 'Non justifiée';
                    const matiere = abs.matiere as Record<string, unknown> | string | undefined;
                    const matNom = typeof matiere === 'object' ? ((matiere as Record<string, unknown>)?.nom ?? 'Cours') as string : (matiere ?? 'Cours') as string;
                    const date = (abs.date ?? abs.dateAbsence ?? '') as string;
                    return (
                      <div
                        key={idx}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderLeft: `3px solid ${borderColor}`, borderBottom: idx < absences.length - 1 ? '1px solid #eef2f6' : 'none' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{matNom}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{date}</div>
                        </div>
                        <div style={{ background: badgeBg, color: badgeColor, fontSize: 11, fontWeight: 600, padding: '3px 8px' }}>{badgeLabel}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'planning' && (() => {
            const planCours = Array.isArray(planningData) ? planningData : ((planningData as Record<string, unknown> | null)?.cours ?? []);
            const JOURS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const byJour = JOURS_ORDER.reduce<Record<string, Record<string, unknown>[]>>((acc, j) => {
              const items = (planCours as Record<string, unknown>[]).filter(
                (c) => (c.jour as string | undefined)?.toLowerCase() === j.toLowerCase()
              );
              if (items.length > 0) acc[j] = items;
              return acc;
            }, {});
            const hasData = Object.keys(byJour).length > 0;
            if (!hasData) return (
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Emploi du temps non disponible.
              </div>
            );
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {JOURS_ORDER.filter((j) => byJour[j]).map((jour) => (
                  <div key={jour}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{jour}</div>
                    <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                      {byJour[jour].map((c, ci) => {
                        const mat = c.matiere as Record<string, unknown> | string | undefined;
                        const matNom = (typeof mat === 'string' ? mat : (mat as Record<string, unknown>)?.nom as string) ?? 'Cours';
                        return (
                          <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: ci < byJour[jour].length - 1 ? '1px solid #eef2f6' : 'none' }}>
                            <div style={{ width: 3, height: 32, background: '#2563eb', flexShrink: 0 }} />
                            <div style={{ fontSize: 12, color: '#94a3b8', width: 90, flexShrink: 0 }}>{(c.heureDebut as string | undefined) ?? ''} – {(c.heureFin as string | undefined) ?? ''}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{matNom}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {activeTab === 'paiements' && (() => {
            const rawPaiements = Array.isArray(paiementsData) ? paiementsData : ((paiementsData as Record<string, unknown> | null)?.paiements ?? (paiementsData as Record<string, unknown> | null)?.echeances ?? []);
            const paiements = rawPaiements as Record<string, unknown>[];
            const totalDu = paiements.filter((p) => p.statut !== 'paye' && p.statut !== 'PAYE').reduce((s, p) => s + ((p.montant as number) ?? 0), 0);
            if (loadingPaiements) return (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chargement…</div>
            );
            if (paiements.length === 0) return (
              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Aucune échéance enregistrée.
              </div>
            );
            return (
              <div>
                {totalDu > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>Solde dû</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{totalDu.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                    <button style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Payer</button>
                  </div>
                )}
                <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                  {paiements.map((p, idx) => {
                    const isPaid = p.statut === 'paye' || p.statut === 'PAYE';
                    return (
                      <div key={String(p.id ?? idx)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: idx < paiements.length - 1 ? '1px solid #eef2f6' : 'none', borderLeft: `3px solid ${isPaid ? '#16a34a' : '#dc2626'}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{(p.libelle ?? p.description ?? 'Paiement') as string}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{(p.date ?? p.datePaiement ?? (isPaid ? '' : 'À régler')) as string}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{((p.montant as number) ?? 0).toLocaleString('fr-FR')} F</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: isPaid ? '#16a34a' : '#dc2626' }}>{isPaid ? 'Payé' : 'À payer'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        )}
        {/* All children cards */}
        {!loadingEnfants && enfants.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Tous les enfants</div>
          {enfants.map((e) => {
            const ep = (e.prenom ?? '') as string;
            const en = (e.nom ?? '') as string;
            const eid = String(e.id);
            const ec = e.classe as Record<string, unknown> | undefined;
            const ecNom = (ec?.nom ?? '—') as string;
            const emoy = (e.moyenne ?? 0) as number;
            const eabs = (e.absences ?? 0) as number;
            const escol = (e.scolarite ?? 'À jour') as string;
            const escolColor = escol === 'À jour' ? '#16a34a' : '#dc2626';
            const einit = ((ep[0] ?? '') + (en[0] ?? '')).toUpperCase() || 'E';
            return (
              <button
                key={eid}
                onClick={() => setSelectedId(eid)}
                style={{ width: '100%', background: '#fff', border: `1px solid ${eid === selectedId ? '#2563eb' : '#e6ebf1'}`, marginBottom: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
              >
                <div style={{ width: 40, height: 40, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {einit}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{ep} {en}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{ecNom}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Moy. <strong style={{ color: '#0f172a' }}>{typeof emoy === 'number' ? emoy.toFixed(1).replace('.', ',') : emoy}</strong></span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Abs. <strong style={{ color: '#0f172a' }}>{eabs}</strong></span>
                    <span style={{ fontSize: 11, color: escolColor, fontWeight: 600 }}>{escol}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
