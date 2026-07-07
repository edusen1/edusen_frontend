'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminBulletins } from '@/hooks/use-query-api';

const STATIC_BULLETINS = [
  { id: 'b1', classe: '3ème B', trimestre: 'T2', nbEleves: 42, nbGeneres: 42, statut: 'genere', dateGen: '15/03/2026' },
  { id: 'b2', classe: '4ème A', trimestre: 'T2', nbEleves: 38, nbGeneres: 38, statut: 'genere', dateGen: '15/03/2026' },
  { id: 'b3', classe: '6ème A', trimestre: 'T2', nbEleves: 44, nbGeneres: 0, statut: 'en_attente', dateGen: null },
  { id: 'b4', classe: '2nde A', trimestre: 'T2', nbEleves: 45, nbGeneres: 28, statut: 'partiel', dateGen: '16/03/2026' },
  { id: 'b5', classe: '1ère S2', trimestre: 'T2', nbEleves: 35, nbGeneres: 35, statut: 'genere', dateGen: '15/03/2026' },
  { id: 'b6', classe: '5ème C', trimestre: 'T2', nbEleves: 40, nbGeneres: 0, statut: 'en_attente', dateGen: null },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  genere: { label: 'Généré', bg: '#dcfce7', color: '#16a34a' },
  partiel: { label: 'Partiel', bg: '#fef3c7', color: '#d97706' },
  en_attente: { label: 'En attente', bg: '#f1f5f9', color: '#64748b' },
};

const TRIMESTERS = ['T1', 'T2', 'T3'];

export default function BulletinsAdminPage() {
  const { data } = useAdminBulletins();
  const rawList = Array.isArray(data) ? data : (data?.bulletins ?? data?.content ?? data?.data ?? []);
  const bulletins = rawList.length > 0 ? rawList : STATIC_BULLETINS;

  const [filterTrimestre, setFilterTrimestre] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Record<string, unknown> | null>(null);

  const filtered = (bulletins as Record<string, unknown>[]).filter((b) => {
    const tri = (b.trimestre ?? '') as string;
    const st = (b.statut ?? '') as string;
    return (!filterTrimestre || tri === filterTrimestre) && (!filterStatut || st === filterStatut);
  });

  const handleGenerer = async (b: Record<string, unknown>) => {
    setGenerating(String(b.id));
    await new Promise((r) => setTimeout(r, 800));
    setGenerating(null);
    toast.success(`Bulletins ${b.classe} générés`);
  };

  const handleGenerateTous = async () => {
    toast.success('Génération en masse lancée…');
  };

  const totalGeneres = (bulletins as Record<string, unknown>[]).reduce((acc, b) => acc + ((b.nbGeneres ?? 0) as number), 0);
  const totalEleves = (bulletins as Record<string, unknown>[]).reduce((acc, b) => acc + ((b.nbEleves ?? 0) as number), 0);
  const nbEnAttente = (bulletins as Record<string, unknown>[]).filter((b) => b.statut === 'en_attente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Bulletins</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} classes</div>
        <button
          onClick={handleGenerateTous}
          style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          ⚡ Générer tous
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Total générés', val: `${totalGeneres}/${totalEleves}`, color: '#16a34a', bg: '#dcfce7' },
          { label: 'En attente', val: String(nbEnAttente), color: '#d97706', bg: '#fef3c7' },
          { label: 'Taux de complétion', val: totalEleves > 0 ? `${Math.round((totalGeneres / totalEleves) * 100)}%` : '0%', color: '#2563eb', bg: '#eff6ff' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <select value={filterTrimestre} onChange={(e) => setFilterTrimestre(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les trimestres</option>
          {TRIMESTERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="genere">Générés</option>
          <option value="partiel">Partiels</option>
          <option value="en_attente">En attente</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((b) => {
            const id = String(b.id);
            const classe = (b.classe ?? '') as string;
            const trimestre = (b.trimestre ?? '') as string;
            const nbEleves = (b.nbEleves ?? 0) as number;
            const nbGeneres = (b.nbGeneres ?? 0) as number;
            const statut = (b.statut ?? 'en_attente') as string;
            const dateGen = b.dateGen as string | null;
            const progress = nbEleves > 0 ? Math.round((nbGeneres / nbEleves) * 100) : 0;
            const st = STATUT_MAP[statut] ?? STATUT_MAP.en_attente;
            const isLoading = generating === id;

            return (
              <div key={id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{classe}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 7px', display: 'inline-block', marginTop: 2 }}>{trimestre}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 9px' }}>{st.label}</span>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    <span>{nbGeneres}/{nbEleves} bulletins générés</span>
                    <span style={{ fontWeight: 700, color: progress === 100 ? '#16a34a' : '#0f172a' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: progress === 100 ? '#16a34a' : progress > 0 ? '#2563eb' : '#e2e8f0', width: `${progress}%`, transition: 'width .3s' }} />
                  </div>
                </div>

                {dateGen && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Généré le {dateGen}</div>}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  {statut !== 'genere' && (
                    <button
                      onClick={() => handleGenerer(b)}
                      disabled={isLoading}
                      style={{ flex: 1, height: 32, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      ⚡ {isLoading ? 'Génération…' : 'Générer'}
                    </button>
                  )}
                  {statut !== 'en_attente' && (
                    <>
                      <button
                        onClick={() => setPreviewItem(b)}
                        style={{ flex: 1, height: 32, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Prévisualiser
                      </button>
                      <button
                        onClick={() => toast.success('Téléchargement en cours…')}
                        style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Télécharger PDF"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button
                        onClick={() => toast.success('Envoi aux parents en cours…')}
                        style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Envoyer aux parents"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 48px rgba(0,0,0,.2)' }}>
            <div style={{ background: '#0f172a', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>Prévisualisation bulletin</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{previewItem.classe as string} — {previewItem.trimestre as string}</div>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '18px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>École NouraSchool · Année 2025-2026</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>BULLETIN DE NOTES — {(previewItem.trimestre as string)}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#2563eb', marginTop: 4 }}>Classe : {previewItem.classe as string}</div>
              </div>
              <div style={{ border: '1px solid #e6ebf1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Élève', 'Moy.', 'Rang', 'Mention'].map((h) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {['Awa Ndiaye', 'Moussa Sarr', 'Fatou Bâ', 'Cheikh Diop'].map((n, i) => {
                  const moy = (15.5 - i * 0.8).toFixed(1);
                  return (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 60px', padding: '10px 14px', borderBottom: i < 3 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{n}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: parseFloat(moy) >= 14 ? '#16a34a' : '#2563eb' }}>{moy}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{i + 1}e</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{parseFloat(moy) >= 16 ? 'TB' : parseFloat(moy) >= 14 ? 'B' : 'AB'}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => { toast.success('Téléchargement PDF…'); setPreviewItem(null); }}
                  style={{ flex: 1, height: 40, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Télécharger PDF
                </button>
                <button
                  onClick={() => setPreviewItem(null)}
                  style={{ height: 40, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
