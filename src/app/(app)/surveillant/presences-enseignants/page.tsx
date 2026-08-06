'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useCoursDuJour, useMarquerPresenceProfesseur } from '@/hooks/use-query-api';
import { entityLabel, personLabel } from '@/lib/display';

/**
 * Pointage des enseignants sur les cours programmés.
 *
 * Cette page affichait cinq enseignants inventés (Oumar Diallo, Fatou Ndiaye,
 * Mamadou Sow, Aissatou Ba, Ibrahima Traoré) qui n'existent dans aucun
 * établissement, et le pointage n'était conservé qu'en mémoire locale.
 * Elle consomme désormais `GET /admin/presences-professeurs/cours-du-jour`
 * et enregistre via `POST /admin/presences-professeurs`.
 */

type Statut = 'PRESENT' | 'ABSENT' | 'RETARD';

interface Cours {
  id: string;
  professeur: string;
  professeurId: string;
  matiere: string;
  classe: string;
  heure: string;
  salle: string;
  statut: Statut | null;
  motif: string;
}

const STATUT_CFG: Record<Statut, { label: string; color: string; bg: string; icon: string }> = {
  PRESENT: { label: 'Présent', color: '#16a34a', bg: '#dcfce7', icon: '✓' },
  ABSENT: { label: 'Absent', color: '#dc2626', bg: '#fee2e2', icon: '✕' },
  RETARD: { label: 'Retard', color: '#d97706', bg: '#fef3c7', icon: '⏱' },
};

export default function PresencesEnseignantsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'TOUS' | Statut>('TOUS');
  const [editModal, setEditModal] = useState<Cours | null>(null);
  const [editForm, setEditForm] = useState<{ statut: Statut; motif: string }>({ statut: 'PRESENT', motif: '' });

  const { data, isPending, isError, error, refetch } = useCoursDuJour({ date: selectedDate });
  const marquer = useMarquerPresenceProfesseur();

  const cours: Cours[] = useMemo(() => {
    const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
    return raw.map((c, i) => {
      const presence = c.presence as Record<string, unknown> | undefined;
      const prof = c.professeur ?? c.enseignant ?? c.user;
      return {
        id: String(c.id ?? c.coursId ?? i),
        professeur: personLabel(prof, '—'),
        professeurId: String(c.professeurId ?? (prof as Record<string, unknown>)?.id ?? ''),
        matiere: entityLabel(c.matiere, '—'),
        classe: entityLabel(c.classe, '—'),
        heure: String(c.heureDebut ?? c.heure ?? '—'),
        salle: entityLabel(c.salle, ''),
        statut: (presence?.statut ?? c.statut ?? null) as Statut | null,
        motif: String(presence?.motif ?? c.motif ?? ''),
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    let list = cours;
    if (filterStatut !== 'TOUS') list = list.filter((c) => c.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.professeur.toLowerCase().includes(q) || c.matiere.toLowerCase().includes(q));
    }
    return list;
  }, [cours, filterStatut, search]);

  const nbPresents = cours.filter((c) => c.statut === 'PRESENT').length;
  const nbAbsents = cours.filter((c) => c.statut === 'ABSENT').length;
  const nbRetards = cours.filter((c) => c.statut === 'RETARD').length;
  const nbPointes = nbPresents + nbAbsents + nbRetards;

  const openEdit = (c: Cours) => {
    setEditModal(c);
    setEditForm({ statut: c.statut ?? 'PRESENT', motif: c.motif });
  };

  const handleSave = () => {
    if (!editModal) return;
    if (editForm.statut !== 'PRESENT' && !editForm.motif.trim()) {
      toast.error('Motif requis pour une absence ou un retard');
      return;
    }
    marquer.mutate(
      {
        coursId: editModal.id,
        professeurId: editModal.professeurId || undefined,
        date: selectedDate,
        statut: editForm.statut,
        motif: editForm.motif.trim() || undefined,
      },
      { onSuccess: () => setEditModal(null) }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Présences enseignants</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Contrôle des présences — hors gestion salariale</div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ marginLeft: 'auto', height: 38, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* Stats */}
      {!isError && (
        <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Présents', count: String(nbPresents), color: '#16a34a' },
            { label: 'Absents', count: String(nbAbsents), color: '#dc2626' },
            { label: 'Retards', count: String(nbRetards), color: '#d97706' },
            {
              label: 'Taux présence',
              count: nbPointes > 0 ? `${Math.round((nbPresents / nbPointes) * 100)}%` : '—',
              color: '#2563eb',
            },
          ].map((s) => (
            <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      {!isError && (
        <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Rechercher enseignant, matière…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', border: '1px solid #e6ebf1', overflow: 'hidden' }}>
            {(['TOUS', 'PRESENT', 'ABSENT', 'RETARD'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                style={{ height: 36, padding: '0 12px', border: 'none', borderRight: '1px solid #e6ebf1', background: filterStatut === s ? '#2563eb' : '#fff', color: filterStatut === s ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {s === 'TOUS' ? 'Tous' : STATUT_CFG[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {isError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Impossible de charger les cours</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>
              {(error as { message?: string })?.message ?? 'Service temporairement indisponible.'}
            </div>
            <button
              onClick={() => refetch()}
              style={{ height: 32, padding: '0 14px', border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </div>
        )}

        {isPending && !isError && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Chargement des cours…
          </div>
        )}

        {!isPending && !isError && (
          <>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1fr 90px 1fr 100px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 760 }}>
                {['Enseignant', 'Matière', 'Classe', 'Heure', 'Motif / Note', 'Statut'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    {cours.length === 0 ? 'Aucun cours programmé ce jour' : 'Aucun cours pour ces filtres'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {cours.length === 0
                      ? "Choisissez une autre date, ou vérifiez que l'emploi du temps est publié."
                      : 'Modifiez la recherche ou le filtre de statut.'}
                  </div>
                </div>
              ) : (
                filtered.map((c, idx) => {
                  const st = c.statut ? STATUT_CFG[c.statut] : null;
                  return (
                    <div
                      key={c.id}
                      onClick={() => openEdit(c)}
                      style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1fr 90px 1fr 100px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 760, cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.professeur}</div>
                      <span style={{ fontSize: 12, color: '#475569' }}>{c.matiere}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{c.classe}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{c.heure}</span>
                      <span style={{ fontSize: 12, color: '#64748b', fontStyle: c.motif ? 'normal' : 'italic' }}>{c.motif || '—'}</span>
                      {st ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 7px', display: 'inline-block' }}>
                          {st.icon} {st.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '3px 7px', display: 'inline-block' }}>
                          Non pointé
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {filtered.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8' }}>Cliquez sur une ligne pour enregistrer le statut</div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 420, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Pointer la présence</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              {editModal.professeur} — {editModal.matiere} · {editModal.classe} ({editModal.heure})
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Statut *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['PRESENT', 'ABSENT', 'RETARD'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditForm((f) => ({ ...f, statut: s }))}
                    style={{ flex: 1, height: 38, border: `2px solid ${editForm.statut === s ? STATUT_CFG[s].color : '#e6ebf1'}`, background: editForm.statut === s ? STATUT_CFG[s].bg : '#fff', color: editForm.statut === s ? STATUT_CFG[s].color : '#475569', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    {STATUT_CFG[s].icon} {STATUT_CFG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {editForm.statut !== 'PRESENT' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Motif *</label>
                <input
                  value={editForm.motif}
                  onChange={(e) => setEditForm((f) => ({ ...f, motif: e.target.value }))}
                  placeholder={editForm.statut === 'ABSENT' ? 'Maladie, convocation…' : 'Transport, urgence…'}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setEditModal(null)}
                disabled={marquer.isPending}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={marquer.isPending}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: marquer.isPending ? 'not-allowed' : 'pointer', opacity: marquer.isPending ? 0.7 : 1 }}
              >
                {marquer.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
