'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { correspondPersonne } from '@/lib/recherche';

/**
 * Choix de l'emprunteur : élève ou membre du personnel.
 *
 * La recherche porte sur le matricule autant que sur le nom — c'est le matricule
 * qui figure sur la carte scolaire, et plusieurs élèves portent souvent le même
 * nom de famille.
 */

const B = '#e6ebf1';

export interface Emprunteur {
  id: string;
  nom: string;
  matricule: string;
  detail: string;
  type: 'ELEVE' | 'ENSEIGNANT';
}

interface Props {
  valeur: Emprunteur | null;
  onChange: (e: Emprunteur | null) => void;
}

export function SelecteurEmprunteur({ valeur, onChange }: Props) {
  const [type, setType] = useState<'ELEVE' | 'ENSEIGNANT'>('ELEVE');
  const [recherche, setRecherche] = useState('');
  const [eleves, setEleves] = useState<Record<string, unknown>[]>([]);
  const [profs, setProfs] = useState<Record<string, unknown>[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const lire = (d: unknown): Record<string, unknown>[] => {
      if (Array.isArray(d)) return d as Record<string, unknown>[];
      const o = (d ?? {}) as Record<string, unknown>;
      return (Array.isArray(o.content) ? o.content : Array.isArray(o.data) ? o.data : []) as Record<string, unknown>[];
    };
    Promise.all([
      apiClient.get('/admin/eleves', { params: { size: 500 } }).catch(() => ({ data: [] })),
      apiClient.get('/admin/professeurs', { params: { size: 200 } }).catch(() => ({ data: [] })),
    ]).then(([e, p]) => {
      setEleves(lire(e.data));
      setProfs(lire(p.data));
    }).finally(() => setChargement(false));
  }, []);

  const resultats = useMemo(() => {
    const source = type === 'ELEVE' ? eleves : profs;
    return source
      .filter((p) => correspondPersonne(recherche, p))
      .slice(0, 40)
      .map<Emprunteur>((p) => ({
        id: String(p.id ?? ''),
        nom: `${p.firstName ?? p.prenom ?? ''} ${p.lastName ?? p.nom ?? ''}`.trim() || 'Sans nom',
        matricule: String(p.matricule ?? ''),
        detail: type === 'ELEVE' ? String(p.classeNom ?? '') : String(p.specialite ?? ''),
        type,
      }));
  }, [type, eleves, profs, recherche]);

  if (valeur) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{valeur.nom}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {valeur.matricule || '—'}{valeur.detail ? ` · ${valeur.detail}` : ''} · {valeur.type === 'ELEVE' ? 'Élève' : 'Enseignant'}
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          style={{ height: 30, padding: '0 12px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${B}` }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${B}` }}>
        {(['ELEVE', 'ENSEIGNANT'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setRecherche(''); }}
            style={{
              flex: 1, height: 34, border: 'none', background: type === t ? '#f8fafc' : '#fff',
              fontSize: 12, fontWeight: type === t ? 700 : 400, color: type === t ? '#2563eb' : '#64748b',
              borderBottom: type === t ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t === 'ELEVE' ? 'Élèves' : 'Enseignants'}
          </button>
        ))}
      </div>

      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Nom, matricule ou téléphone…"
        autoFocus
        style={{ width: '100%', height: 36, border: 'none', borderBottom: `1px solid ${B}`, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
      />

      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {chargement && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Chargement…</div>}
        {!chargement && resultats.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            {recherche ? 'Aucun résultat' : 'Saisissez un nom ou un matricule'}
          </div>
        )}
        {resultats.map((r) => (
          <button
            key={r.id}
            onClick={() => onChange(r)}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div style={{ fontSize: 13, color: '#0f172a' }}>{r.nom}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.matricule || '—'}{r.detail ? ` · ${r.detail}` : ''}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
