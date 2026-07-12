'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const B = '#e6ebf1';

export default function ProfConfigPage() {
  const [mode, setMode] = useState('MOYENNE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/professeur/configuration')
      .then((r) => { setMode(String((r.data as Record<string, unknown>)?.modeCalculNotes ?? 'MOYENNE')); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.patch('/professeur/configuration', { modeCalculNotes: mode });
      toast.success('Configuration enregistrée');
    } catch { toast.error('Erreur'); }
    setSaving(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0, padding: '12px 16px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Configuration</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
          ) : (
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Mode de calcul des notes</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
                Choisissez comment les notes de devoirs seront calculees pour le bulletin. Ce choix peut etre modifie a tout moment avant la generation des bulletins par l&apos;administration.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <label onClick={() => setMode('MOYENNE')} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `2px solid ${mode === 'MOYENNE' ? '#2563eb' : B}`, background: mode === 'MOYENNE' ? '#eff6ff' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" checked={mode === 'MOYENNE'} onChange={() => setMode('MOYENNE')} style={{ accentColor: '#2563eb', marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Moyenne des devoirs</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>La moyenne de toutes les notes de devoir est calculee et utilisee pour le bulletin.</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Exemple : 12 + 14 + 10 = <strong>12/20</strong></div>
                  </div>
                </label>

                <label onClick={() => setMode('MEILLEURE_NOTE')} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `2px solid ${mode === 'MEILLEURE_NOTE' ? '#2563eb' : B}`, background: mode === 'MEILLEURE_NOTE' ? '#eff6ff' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" checked={mode === 'MEILLEURE_NOTE'} onChange={() => setMode('MEILLEURE_NOTE')} style={{ accentColor: '#2563eb', marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Meilleure note</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Seule la meilleure note parmi tous les devoirs est retenue pour le bulletin.</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Exemple : 12, 14, 10 → <strong>14/20</strong></div>
                  </div>
                </label>
              </div>

              <button onClick={() => void handleSave()} disabled={saving} style={{ width: '100%', height: 40, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
