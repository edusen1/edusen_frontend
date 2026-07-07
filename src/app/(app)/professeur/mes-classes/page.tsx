'use client';

import { useState } from 'react';
import { useProfesseurMesClasses } from '@/hooks/use-query-api';
import Link from 'next/link';

const CLASS_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#e11d48', '#0891b2'];

const STATIC_CLASSES = [
  { id: 'c1', nom: '3ᵉ B', matiere: 'Mathématiques', effectif: 32, moyenne: 13.8, prochainCours: 'Mar. 08:00 · B12', accentColor: '#2563eb', accentBg: '#eff6ff', accentText: '#2563eb' },
  { id: 'c2', nom: '4ᵉ A', matiere: 'Mathématiques', effectif: 30, moyenne: 12.4, prochainCours: 'Mar. 10:00 · A04', accentColor: '#7c3aed', accentBg: '#f5f3ff', accentText: '#7c3aed' },
  { id: 'c3', nom: '4ᵉ B', matiere: 'Mathématiques', effectif: 29, moyenne: 13.1, prochainCours: 'Mer. 09:00 · B07', accentColor: '#059669', accentBg: '#ecfdf5', accentText: '#059669' },
  { id: 'c4', nom: '5ᵉ A', matiere: 'Mathématiques', effectif: 31, moyenne: 14.0, prochainCours: 'Jeu. 11:00 · C03', accentColor: '#d97706', accentBg: '#fffbeb', accentText: '#d97706' },
  { id: 'c5', nom: '5ᵉ B', matiere: 'Mathématiques', effectif: 28, moyenne: 13.5, prochainCours: 'Ven. 08:00 · B12', accentColor: '#e11d48', accentBg: '#fef2f2', accentText: '#e11d48' },
];

export default function MesClassesPage() {
  const { data } = useProfesseurMesClasses();
  const [search, setSearch] = useState('');
  const rawClasses = Array.isArray(data) ? data : (data?.classes ?? data?.classesMatieres ?? []);
  const allClasses = rawClasses.length > 0 ? rawClasses : STATIC_CLASSES;
  const classes = (allClasses as Record<string, unknown>[]).filter((c) => {
    const classeObj = c.classe as Record<string, unknown> | undefined;
    const nom = String(c.nom ?? classeObj?.nom ?? '').toLowerCase();
    return !search || nom.includes(search.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Mes classes</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{allClasses.length} classes · 2025–2026</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', padding: '0 12px', background: '#f8fafc', minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 38, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {(classes as Record<string, unknown>[]).map((c, idx) => {
            const classeObj = c.classe as Record<string, unknown> | undefined;
            const matiereObj = c.matiere as Record<string, unknown> | undefined;
            const nom = (c.nom ?? classeObj?.nom ?? `Classe ${idx + 1}`) as string;
            const matiere = (matiereObj?.nom ?? c.matiere ?? c.matiereNom ?? 'Matière') as string;
            const effectif = (c.effectif ?? c.nbEleves ?? 0) as number;
            const moyenne = (c.moyenneClasse ?? c.moyenne ?? 0) as number;
            const prochainCours = (c.prochainCours ?? 'À définir') as string;
            const color = STATIC_CLASSES[idx % STATIC_CLASSES.length];
            const accentColor = color.accentColor;
            const accentBg = color.accentBg;
            const accentText = color.accentText;
            const cid = (c.id ?? c.classeId ?? String(idx)) as string;

            return (
              <div key={String(cid)} style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                <div style={{ height: 6, background: accentColor }} />
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{nom}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: accentText, background: accentBg, padding: '3px 9px' }}>{matiere}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{effectif}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Élèves</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{typeof moyenne === 'number' ? moyenne.toFixed(1).replace('.', ',') : moyenne}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Moy. classe</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 16, paddingTop: 14, borderTop: '1px solid #eef2f6' }}>
                    Prochain cours : <strong style={{ color: '#0f172a' }}>{prochainCours}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Link href={`/professeur/appel?classeId=${cid}`} style={{ flex: 1 }}>
                      <button style={{ width: '100%', height: 36, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        Faire l'appel
                      </button>
                    </Link>
                    <Link href={`/professeur/saisir-notes?classeId=${cid}`} style={{ flex: 1 }}>
                      <button style={{ width: '100%', height: 36, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        Notes
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
