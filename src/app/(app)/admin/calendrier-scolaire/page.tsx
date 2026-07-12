'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const TYPE_CATEGORIES = [
  { label: 'Périodes', types: ['RENTREE', 'FIN_ANNEE', 'DEBUT_TRIMESTRE', 'FIN_TRIMESTRE', 'REPRISE_COURS'] },
  { label: 'Vacances / Congés', types: ['VACANCES', 'JOUR_FERIE', 'PONT'] },
  { label: 'Évaluations', types: ['DEVOIR_SURVEILLE', 'COMPOSITION', 'EXAMEN_BLANC', 'EXAMEN_OFFICIEL', 'RATTRAPAGE', 'REMISE_COPIES'] },
  { label: 'Réunions', types: ['CONSEIL_CLASSE', 'CONSEIL_DISCIPLINE', 'REUNION_PARENTS', 'REUNION_PEDAGOGIQUE', 'ASSEMBLEE_GENERALE'] },
  { label: 'Vie scolaire', types: ['JOURNEE_PORTES_OUVERTES', 'JOURNEE_CULTURELLE', 'JOURNEE_SPORTIVE', 'REMISE_PRIX', 'SORTIE_PEDAGOGIQUE', 'SEMAINE_REVISION', 'PUBLICATION_BULLETINS', 'DISTRIBUTION_CARTES'] },
  { label: 'Administratif', types: ['DATE_LIMITE_INSCRIPTION', 'DATE_LIMITE_PAIEMENT', 'FORMATION_ENSEIGNANTS', 'AUTRE'] },
];

const TYPE_LABELS: Record<string, string> = {
  RENTREE: 'Rentrée', FIN_ANNEE: 'Fin d\'année', DEBUT_TRIMESTRE: 'Début trimestre', FIN_TRIMESTRE: 'Fin trimestre', REPRISE_COURS: 'Reprise des cours',
  VACANCES: 'Vacances', JOUR_FERIE: 'Jour férié', PONT: 'Pont',
  DEVOIR_SURVEILLE: 'Devoir surveillé', COMPOSITION: 'Composition', EXAMEN_BLANC: 'Examen blanc', EXAMEN_OFFICIEL: 'Examen officiel', RATTRAPAGE: 'Rattrapage', REMISE_COPIES: 'Remise copies',
  CONSEIL_CLASSE: 'Conseil de classe', CONSEIL_DISCIPLINE: 'Conseil discipline', REUNION_PARENTS: 'Réunion parents', REUNION_PEDAGOGIQUE: 'Réunion pédagogique', ASSEMBLEE_GENERALE: 'Assemblée générale',
  JOURNEE_PORTES_OUVERTES: 'Portes ouvertes', JOURNEE_CULTURELLE: 'Journée culturelle', JOURNEE_SPORTIVE: 'Journée sportive', REMISE_PRIX: 'Remise des prix', SORTIE_PEDAGOGIQUE: 'Sortie pédagogique', SEMAINE_REVISION: 'Semaine révision', PUBLICATION_BULLETINS: 'Publication bulletins', DISTRIBUTION_CARTES: 'Distribution cartes',
  DATE_LIMITE_INSCRIPTION: 'Date limite inscription', DATE_LIMITE_PAIEMENT: 'Date limite paiement', FORMATION_ENSEIGNANTS: 'Formation enseignants', AUTRE: 'Autre',
};

const TYPE_COLORS: Record<string, string> = {
  RENTREE: '#2563eb', FIN_ANNEE: '#2563eb', DEBUT_TRIMESTRE: '#2563eb', FIN_TRIMESTRE: '#2563eb', REPRISE_COURS: '#2563eb',
  VACANCES: '#d97706', JOUR_FERIE: '#d97706', PONT: '#d97706',
  DEVOIR_SURVEILLE: '#dc2626', COMPOSITION: '#dc2626', EXAMEN_BLANC: '#dc2626', EXAMEN_OFFICIEL: '#dc2626', RATTRAPAGE: '#dc2626', REMISE_COPIES: '#dc2626',
  CONSEIL_CLASSE: '#7c3aed', CONSEIL_DISCIPLINE: '#7c3aed', REUNION_PARENTS: '#7c3aed', REUNION_PEDAGOGIQUE: '#7c3aed', ASSEMBLEE_GENERALE: '#7c3aed',
  JOURNEE_PORTES_OUVERTES: '#16a34a', JOURNEE_CULTURELLE: '#16a34a', JOURNEE_SPORTIVE: '#16a34a', REMISE_PRIX: '#16a34a', SORTIE_PEDAGOGIQUE: '#16a34a', SEMAINE_REVISION: '#16a34a', PUBLICATION_BULLETINS: '#16a34a', DISTRIBUTION_CARTES: '#16a34a',
  DATE_LIMITE_INSCRIPTION: '#475569', DATE_LIMITE_PAIEMENT: '#475569', FORMATION_ENSEIGNANTS: '#475569', AUTRE: '#475569',
};

const STATUT_LABELS: Record<string, string> = { PLANIFIE: 'Planifié', CONFIRME: 'Confirmé', ANNULE: 'Annulé', REPORTE: 'Reporté' };
const STATUT_COLORS: Record<string, string> = { PLANIFIE: '#64748b', CONFIRME: '#16a34a', ANNULE: '#dc2626', REPORTE: '#d97706' };
const VISIBILITE_LABELS: Record<string, string> = { TOUS: 'Tous', ADMIN_ONLY: 'Admin', ENSEIGNANTS: 'Enseignants', PARENTS: 'Parents', ELEVES: 'Élèves' };

type Evt = Record<string, unknown> & { id: string; titre: string; dateDebut: string; type: string; statut: string };
const EMPTY_FORM = { titre: '', description: '', dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', type: 'AUTRE', statut: 'PLANIFIE', visibilite: 'TOUS', sectionId: '', classeId: '', niveauId: '', couleur: '', important: false };

function fmtDate(v: string) { try { return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; } }
function dateKey(v: string) { return v.slice(0, 10); }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendrierScolairePage() {
  const [events, setEvents] = useState<Evt[]>([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/configuration/calendrier-scolaire');
      const d = res.data;
      setEvents(Array.isArray(d) ? d : (d?.data ?? d?.content ?? []));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchEvents(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEvents]);

  function openCreate(date?: string) {
    setEditId(null);
    setForm({ ...EMPTY_FORM, dateDebut: date ?? '' });
    setShowModal(true);
  }

  function openEdit(e: Evt) {
    setEditId(e.id);
    setForm({
      titre: String(e.titre ?? ''),
      description: String(e.description ?? ''),
      dateDebut: dateKey(e.dateDebut),
      dateFin: e.dateFin ? dateKey(String(e.dateFin)) : '',
      heureDebut: String(e.heureDebut ?? ''),
      heureFin: String(e.heureFin ?? ''),
      type: String(e.type ?? 'AUTRE'),
      statut: String(e.statut ?? 'PLANIFIE'),
      visibilite: String(e.visibilite ?? 'TOUS'),
      sectionId: String(e.sectionId ?? ''),
      classeId: String(e.classeId ?? ''),
      niveauId: String(e.niveauId ?? ''),
      couleur: String(e.couleur ?? ''),
      important: Boolean(e.important),
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.titre.trim()) { toast.error('Titre requis'); return; }
    if (!form.dateDebut) { toast.error('Date de début requise'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        sectionId: form.sectionId || null,
        classeId: form.classeId || null,
        niveauId: form.niveauId || null,
        dateFin: form.dateFin || null,
        heureDebut: form.heureDebut || null,
        heureFin: form.heureFin || null,
        couleur: form.couleur || null,
      };
      if (editId) {
        await apiClient.patch(`/admin/configuration/calendrier-scolaire/${editId}`, body);
        toast.success('Événement modifié');
      } else {
        await apiClient.post('/admin/configuration/calendrier-scolaire', body);
        toast.success('Événement créé');
      }
      setShowModal(false);
      void fetchEvents();
    } catch { toast.error('Erreur'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await apiClient.delete(`/admin/configuration/calendrier-scolaire/${id}`);
      toast.success('Supprimé');
      void fetchEvents();
    } catch { toast.error('Erreur'); }
  }


  // ── Calendar grid ───────────────────────────────────────────────────────

  const firstDay = new Date(annee, mois, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(annee, mois + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const filtered = filterType ? events.filter((e) => e.type === filterType) : events;
  const eventsByDate = new Map<string, Evt[]>();
  for (const e of filtered) {
    const start = new Date(dateKey(e.dateDebut));
    const end = e.dateFin ? new Date(dateKey(String(e.dateFin))) : start;
    const cursor = new Date(start);
    while (cursor <= end) {
      const dk = cursor.toISOString().slice(0, 10);
      if (!eventsByDate.has(dk)) eventsByDate.set(dk, []);
      eventsByDate.get(dk)!.push(e);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const upcoming = [...filtered]
    .filter((e) => new Date(e.dateDebut) >= new Date() && e.statut !== 'ANNULE')
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
    .slice(0, 8);

  function prevMonth() { if (mois === 0) { setMois(11); setAnnee((a) => a - 1); } else setMois((m) => m - 1); }
  function nextMonth() { if (mois === 11) { setMois(0); setAnnee((a) => a + 1); } else setMois((m) => m + 1); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Calendrier scolaire</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} événement(s)</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 34, border: '1px solid #e2e8f0', background: '#fff', padding: '0 8px', fontSize: 12, fontFamily: 'inherit' }}>
            <option value="">Tous les types</option>
            {TYPE_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </optgroup>
            ))}
          </select>
          <button onClick={() => openCreate()} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Ajouter
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 16, padding: 20 }}>
        {/* Calendar grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{MOIS[mois]} {annee}</div>
            <button onClick={nextMonth} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>›</button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#fff', border: '1px solid #e6ebf1' }}>
              {/* Day headers */}
              {JOURS_SEMAINE.map((j) => (
                <div key={j} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>{j}</div>
              ))}
              {/* Cells */}
              {cells.map((day, i) => {
                const dk = day ? `${annee}-${String(mois + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                const dayEvts = dk ? (eventsByDate.get(dk) ?? []) : [];
                const isToday = day && dk === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={i}
                    onClick={() => day ? openCreate(dk) : undefined}
                    style={{ minHeight: 80, padding: 4, borderRight: (i + 1) % 7 !== 0 ? '1px solid #f1f5f9' : 'none', borderBottom: '1px solid #f1f5f9', cursor: day ? 'pointer' : 'default', background: isToday ? '#eff6ff' : day ? '#fff' : '#fafbfc' }}
                  >
                    {day && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? '#2563eb' : '#475569', marginBottom: 2 }}>{day}</div>
                        {dayEvts.slice(0, 3).map((e) => {
                          const c = String(e.couleur || TYPE_COLORS[e.type] || '#475569');
                          return (
                            <div key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} style={{ fontSize: 9, padding: '1px 4px', marginBottom: 1, background: c + '18', color: c, borderLeft: `2px solid ${c}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: e.statut === 'ANNULE' ? 'line-through' : 'none' }}>
                              {e.important ? '★ ' : ''}{e.titre}
                            </div>
                          );
                        })}
                        {dayEvts.length > 3 && <div style={{ fontSize: 9, color: '#94a3b8' }}>+{dayEvts.length - 3}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {[
              { label: 'Périodes', color: '#2563eb' },
              { label: 'Vacances/Fériés', color: '#d97706' },
              { label: 'Évaluations', color: '#dc2626' },
              { label: 'Réunions', color: '#7c3aed' },
              { label: 'Vie scolaire', color: '#16a34a' },
              { label: 'Administratif', color: '#475569' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: upcoming events */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Prochains événements</div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Aucun événement à venir</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcoming.map((e) => {
                const c = (e.couleur as string) || TYPE_COLORS[e.type] || '#475569';
                return (
                  <div key={e.id} onClick={() => openEdit(e)} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '10px 12px', cursor: 'pointer', borderLeft: `3px solid ${c}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{e.important ? '★ ' : ''}{e.titre}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                      {fmtDate(e.dateDebut)}
                      {e.heureDebut ? ` · ${e.heureDebut}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 9, padding: '1px 5px', background: c + '18', color: c, fontWeight: 600 }}>{TYPE_LABELS[e.type] ?? e.type}</span>
                      <span style={{ fontSize: 9, padding: '1px 5px', background: STATUT_COLORS[e.statut] + '18', color: STATUT_COLORS[e.statut], fontWeight: 600 }}>{STATUT_LABELS[e.statut]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'relative', background: '#fff', width: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{editId ? 'Modifier l\'événement' : 'Nouvel événement'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Titre */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Titre *</label>
                <input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              {/* Type */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Type</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  {TYPE_CATEGORIES.map((cat) => (
                    <optgroup key={cat.label} label={cat.label}>
                      {cat.types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              {/* Dates + heures */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Date début *</label>
                  <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Date fin</label>
                  <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Heure début</label>
                  <input type="time" value={form.heureDebut} onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Heure fin</label>
                  <input type="time" value={form.heureFin} onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              </div>
              {/* Statut + Visibilité */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Statut</label>
                  <select value={form.statut} onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                    {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Visibilité</label>
                  <select value={form.visibilite} onChange={(e) => setForm((f) => ({ ...f, visibilite: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                    {Object.entries(VISIBILITE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              {/* Important */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.important} onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))} style={{ accentColor: '#2563eb', width: 15, height: 15 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Événement important (★)</span>
              </label>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
              <div>
                {editId && (
                  <button onClick={() => { setShowModal(false); handleDelete(editId); }} style={{ height: 34, padding: '0 14px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Supprimer</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ height: 34, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => void handleSave()} disabled={saving} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
