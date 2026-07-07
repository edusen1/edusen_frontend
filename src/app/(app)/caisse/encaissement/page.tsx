'use client';

import { useState } from 'react';
import { useCreateCaissePaiement, useCaissePaiements } from '@/hooks/use-query-api';

const TYPES_PAIEMENT = [
  'Scolarité T1',
  'Scolarité T2',
  'Scolarité T3',
  'Frais d\'inscription',
  'Frais d\'examen',
  'Fournitures scolaires',
  'Autre',
];

const MODES_PAIEMENT = ['Espèces', 'Wave', 'Orange Money', 'Virement'];

const MODE_COLORS: Record<string, { bg: string; color: string }> = {
  'Espèces': { bg: '#dcfce7', color: '#16a34a' },
  'Wave': { bg: '#eff6ff', color: '#2563eb' },
  'Orange Money': { bg: '#ffedd5', color: '#c2410c' },
  'Virement': { bg: '#f5f3ff', color: '#7c3aed' },
};

const EMPTY_FORM = {
  nomEleve: '',
  classeEleve: '',
  typePaiement: 'Scolarité T3',
  montant: '',
  modePaiement: 'Espèces',
  reference: '',
  date: new Date().toISOString().split('T')[0],
};

export default function EncaissementPage() {
  const createPaiement = useCreateCaissePaiement();
  const { data: histData } = useCaissePaiements({ statut: 'VALIDE' });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Today's validated transactions for the summary panel
  const today = new Date().toISOString().split('T')[0];
  const rawHist = Array.isArray(histData) ? histData : (histData?.paiements ?? histData?.data ?? []);
  const todayTx = (rawHist as Record<string, unknown>[]).filter((p) => {
    const d = String(p.datePaiement ?? p.date ?? p.createdAt ?? '');
    return d.startsWith(today);
  });
  const todayTotal = todayTx.reduce((s, p) => s + (Number(p.montant) || 0), 0);

  const set = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nomEleve.trim()) e.nomEleve = 'Nom de l\'élève requis';
    if (!form.montant || isNaN(Number(form.montant)) || Number(form.montant) <= 0) e.montant = 'Montant invalide';
    if (!form.date) e.date = 'Date requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await createPaiement.mutateAsync({
      nomEleve: form.nomEleve,
      classe: form.classeEleve,
      type: form.typePaiement,
      montant: Number(form.montant),
      modePaiement: form.modePaiement,
      reference: form.reference,
      date: form.date,
      statut: 'VALIDE',
    });
    setForm(EMPTY_FORM);
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const fd = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; } };

  const fieldStyle = (key: string) => ({
    width: '100%',
    height: 40,
    border: `1px solid ${errors[key] ? '#fecaca' : '#d9e0e8'}`,
    padding: '0 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    background: errors[key] ? '#fff8f8' : '#fff',
    color: '#0f172a',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Encaissement</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Enregistrer un nouveau paiement</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', maxWidth: 1000 }}>

          {/* Form */}
          <div style={{ flex: '1 1 380px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouveau paiement</div>

              {/* Élève */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom de l&apos;élève *</label>
                  <input
                    value={form.nomEleve}
                    onChange={(e) => set('nomEleve', e.target.value)}
                    placeholder="Ex: Moussa Diallo"
                    style={fieldStyle('nomEleve')}
                  />
                  {errors.nomEleve && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.nomEleve}</div>}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe</label>
                  <input
                    value={form.classeEleve}
                    onChange={(e) => set('classeEleve', e.target.value)}
                    placeholder="Ex: 3ème B"
                    style={fieldStyle('classeEleve')}
                  />
                </div>
              </div>

              {/* Type + Montant */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type de paiement</label>
                  <select
                    value={form.typePaiement}
                    onChange={(e) => set('typePaiement', e.target.value)}
                    style={{ ...fieldStyle('typePaiement'), cursor: 'pointer' }}
                  >
                    {TYPES_PAIEMENT.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Montant (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.montant}
                    onChange={(e) => set('montant', e.target.value)}
                    placeholder="Ex: 75000"
                    style={fieldStyle('montant')}
                  />
                  {errors.montant && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.montant}</div>}
                </div>
              </div>

              {/* Mode + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Mode de paiement</label>
                  <select
                    value={form.modePaiement}
                    onChange={(e) => set('modePaiement', e.target.value)}
                    style={{ ...fieldStyle('modePaiement'), cursor: 'pointer' }}
                  >
                    {MODES_PAIEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    style={fieldStyle('date')}
                  />
                  {errors.date && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.date}</div>}
                </div>
              </div>

              {/* Référence */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Référence / N° reçu</label>
                <input
                  value={form.reference}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="Ex: REC-2026-001"
                  style={fieldStyle('reference')}
                />
              </div>

              {/* Mode badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {MODES_PAIEMENT.map((m) => {
                  const mc = MODE_COLORS[m] ?? { bg: '#f1f5f9', color: '#475569' };
                  const isActive = form.modePaiement === m;
                  return (
                    <button
                      key={m}
                      onClick={() => set('modePaiement', m)}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: isActive ? 700 : 500, background: isActive ? mc.bg : '#f8fafc', color: isActive ? mc.color : '#94a3b8', border: isActive ? `1.5px solid ${mc.color}` : '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* Summary preview */}
              {form.nomEleve && form.montant && (
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Aperçu</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{form.nomEleve}{form.classeEleve ? ` — ${form.classeEleve}` : ''}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{form.typePaiement} · {form.modePaiement}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>
                      {Number(form.montant) > 0 ? fmt(Number(form.montant)) : '—'}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={createPaiement.isPending}
                style={{ width: '100%', height: 44, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createPaiement.isPending ? 0.7 : 1 }}
              >
                {createPaiement.isPending ? 'Enregistrement…' : 'Enregistrer le paiement'}
              </button>
            </div>
          </div>

          {/* Right: today's summary */}
          <div style={{ flex: '0 0 280px', minWidth: 240 }}>
            {/* Daily total */}
            <div style={{ background: '#0f172a', padding: '18px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Encaissé aujourd&apos;hui</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{fmt(todayTotal)}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{todayTx.length} transaction{todayTx.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Today's transactions */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f6', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Transactions du jour</div>
              {todayTx.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Aucune transaction aujourd&apos;hui</div>
              ) : (
                (todayTx as Record<string, unknown>[]).slice(0, 8).map((p, idx) => {
                  const mc = MODE_COLORS[p.mode as string ?? p.modePaiement as string] ?? { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: idx < todayTx.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{String(p.eleve ?? p.nomEleve ?? '—')}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{String(p.type ?? p.typePaiement ?? '')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{fmt(Number(p.montant) || 0)}</div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: mc.color, background: mc.bg, padding: '1px 6px', display: 'inline-block' }}>{String(p.mode ?? p.modePaiement ?? '')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 16, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Montants fréquents</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[25000, 50000, 75000, 100000, 120000, 150000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => set('montant', String(amount))}
                    style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, background: Number(form.montant) === amount ? '#0f172a' : '#f8fafc', color: Number(form.montant) === amount ? '#fff' : '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {(amount / 1000)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
