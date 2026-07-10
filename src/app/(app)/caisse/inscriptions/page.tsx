'use client';

import { useState } from 'react';
import { useCaisseInscriptions, useValiderInscription } from '@/hooks/use-query-api';
import { classeLabel } from '@/lib/display';

const STATIC_INSCRIPTIONS = [
  { id: 'i1', eleve: 'Moussa Diallo', classe: '3ème B', anneeScolaire: '2025-2026', dateInscription: '2025-09-01', frais: 25000, statut: 'EN_ATTENTE' },
  { id: 'i2', eleve: 'Aminata Sarr', classe: '6ème A', anneeScolaire: '2025-2026', dateInscription: '2025-09-02', frais: 25000, statut: 'VALIDEE' },
  { id: 'i3', eleve: 'Ibrahima Fall', classe: '4ème B', anneeScolaire: '2025-2026', dateInscription: '2025-09-03', frais: 25000, statut: 'EN_ATTENTE' },
  { id: 'i4', eleve: 'Fatou Ndiaye', classe: '5ème C', anneeScolaire: '2025-2026', dateInscription: '2025-09-04', frais: 25000, statut: 'EN_ATTENTE' },
  { id: 'i5', eleve: 'Cheikh Ba', classe: '2nde A', anneeScolaire: '2025-2026', dateInscription: '2025-09-05', frais: 30000, statut: 'VALIDEE' },
  { id: 'i6', eleve: 'Rokhaya Sow', classe: '3ème A', anneeScolaire: '2025-2026', dateInscription: '2025-09-06', frais: 25000, statut: 'EN_ATTENTE' },
];

type FilterKey = 'tous' | 'EN_ATTENTE' | 'VALIDEE';

export default function CaisseInscriptionsPage() {
  const { data, isLoading } = useCaisseInscriptions();
  const valider = useValiderInscription();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('tous');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const raw = Array.isArray(data) ? data : (data?.inscriptions ?? data?.data ?? []);
  const inscriptions = (raw as Record<string, unknown>[]).length > 0
    ? (raw as Record<string, unknown>[]).map((i, idx) => ({
        id: String(i.id ?? i._id ?? idx),
        eleve: String(i.eleve ?? i.nomEleve ?? (i.eleve as Record<string, unknown>)?.prenom + ' ' + (i.eleve as Record<string, unknown>)?.nom ?? ''),
        classe: classeLabel(i.classe, ''),
        anneeScolaire: String(i.anneeScolaire ?? i.annee ?? '2025-2026'),
        dateInscription: String(i.dateInscription ?? i.createdAt ?? ''),
        frais: Number(i.fraisInscription ?? i.frais ?? i.montant ?? 0),
        statut: String(i.statut ?? 'EN_ATTENTE'),
      }))
    : STATIC_INSCRIPTIONS;

  const enAttente = inscriptions.filter((i) => i.statut === 'EN_ATTENTE').length;
  const validees = inscriptions.filter((i) => i.statut === 'VALIDEE').length;
  const totalFrais = inscriptions.filter((i) => i.statut === 'VALIDEE').reduce((s, i) => s + i.frais, 0);

  const filtered = inscriptions.filter((i) => {
    const matchSearch = !search || i.eleve.toLowerCase().includes(search.toLowerCase()) || i.classe.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'tous' || i.statut === filter;
    return matchSearch && matchFilter;
  });

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const fd = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Inscriptions</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{enAttente} en attente de validation</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'En attente', value: enAttente, color: '#d97706', bg: '#fef3c7' },
          { label: 'Validées', value: validees, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Total inscriptions', value: inscriptions.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Frais perçus', value: fmt(totalFrais), color: '#0f172a', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 160px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: '1 1 200px', maxWidth: 300 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher élève, classe…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0' }}>
          {(['tous', 'EN_ATTENTE', 'VALIDEE'] as FilterKey[]).map((f) => {
            const labels: Record<FilterKey, string> = { tous: 'Tous', EN_ATTENTE: 'En attente', VALIDEE: 'Validées' };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ padding: '7px 14px', fontSize: 12, fontWeight: filter === f ? 700 : 400, background: filter === f ? '#2563eb' : 'transparent', color: filter === f ? '#fff' : '#475569', border: 'none', borderLeft: f !== 'tous' ? '1px solid #e6ebf1' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 110px 110px 160px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 720 }}>
              {['Élève', 'Classe', 'Année', 'Date', 'Frais', 'Statut / Action'].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
              ))}
            </div>
            {filtered.map((i, idx) => {
              const isPending = i.statut === 'EN_ATTENTE';
              return (
                <div
                  key={i.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 110px 110px 160px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 720, cursor: 'pointer' }}
                  onClick={() => setDetail(i as unknown as Record<string, unknown>)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {i.eleve.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{i.eleve}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#475569' }}>{i.classe}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{i.anneeScolaire}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{fd(i.dateInscription)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmt(i.frais)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    {isPending ? (
                      <button
                        onClick={() => valider.mutate(i.id)}
                        disabled={valider.isPending}
                        style={{ height: 30, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: valider.isPending ? 0.7 : 1 }}
                      >
                        Valider
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px' }}>Validée</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune inscription trouvée</div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 440, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Détail inscription</div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            {[
              { label: 'Élève', value: detail.eleve as string },
              { label: 'Classe', value: detail.classe as string },
              { label: 'Année scolaire', value: detail.anneeScolaire as string },
              { label: 'Date inscription', value: fd(detail.dateInscription as string) },
              { label: 'Frais', value: fmt(detail.frais as number) },
              { label: 'Statut', value: detail.statut as string },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
            {detail.statut === 'EN_ATTENTE' && (
              <button
                onClick={() => { valider.mutate(detail.id as string); setDetail(null); }}
                disabled={valider.isPending}
                style={{ marginTop: 20, width: '100%', height: 42, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Valider l&apos;inscription
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
