'use client';

import { displayValue, formatDateFr, personLabel } from '@/lib/display';
import { useState } from 'react';
import { useAdminPointages, useAdminPersonnel, useCreatePointage } from '@/hooks/use-query-api';

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  PRESENT: { label: 'Présent', bg: '#dcfce7', color: '#16a34a' },
  present: { label: 'Présent', bg: '#dcfce7', color: '#16a34a' },
  RETARD: { label: 'Retard', bg: '#fef3c7', color: '#d97706' },
  retard: { label: 'Retard', bg: '#fef3c7', color: '#d97706' },
  ABSENT: { label: 'Absent', bg: '#fee2e2', color: '#dc2626' },
  absent: { label: 'Absent', bg: '#fee2e2', color: '#dc2626' },
  DEMI_JOURNEE: { label: 'Demi-journée', bg: '#f3e8ff', color: '#7c3aed' },
};

const METHODE_LABELS: Record<string, string> = {
  MANUEL: 'Manuel',
  BADGE: 'Badge',
  BIOMETRIE: 'Biométrie',
  QR_CODE: 'QR Code',
};

const EMPTY_FORM = {
  personnelId: '',
  statut: 'PRESENT',
  heureArrivee: '',
  heureDepart: '',
  methode: 'MANUEL',
  observations: '',
};

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

function getPersonnelLabel(p: Record<string, unknown>): string {
  // L'API renvoie tantôt `personnel`, tantôt `user`, tantôt les champs à plat.
  // Sans ce repli, la colonne restait vide.
  return personLabel(p.personnel ?? p.user ?? p.utilisateur ?? p, '—');
}

/**
 * Poste de l'agent. La ligne de pointage ne le porte pas directement :
 * il faut descendre dans `personnel.utilisateur.role`, sinon la colonne
 * reste sur un tiret.
 */
function getPosteLabel(p: Record<string, unknown>): string {
  const personnel = (p.personnel ?? p.utilisateur ?? {}) as Record<string, unknown>;
  const utilisateur = (personnel.utilisateur ?? personnel) as Record<string, unknown>;
  const poste =
    p.poste ??
    p.fonction ??
    utilisateur.role ??
    utilisateur.specialite ??
    personnel.typeContrat;
  return displayValue(poste);
}

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function PointagesPage() {
  const { data } = useAdminPointages();
  const { data: personnelData } = useAdminPersonnel();
  // Aucun repli sur des données de démonstration : une liste vide reste vide.
  // Le repli précédent affichait cinq agents fictifs dès que l'API ne renvoyait rien.
  const pointages = (Array.isArray(data) ? data : (data?.pointages ?? data?.data ?? [])) as Record<string, unknown>[];
  const rawPersonnel = Array.isArray(personnelData) ? personnelData : (personnelData?.personnel ?? personnelData?.data ?? []);

  const createPointage = useCreatePointage();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailItem, setDetailItem] = useState<Record<string, unknown> | null>(null);

  const list = (pointages as Record<string, unknown>[]).filter((p) => {
    const name = getPersonnelLabel(p).toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const nbPresents = list.filter((p) => p.statut === 'PRESENT' || p.statut === 'present').length;
  const nbAbsents = list.filter((p) => p.statut === 'ABSENT' || p.statut === 'absent').length;
  const nbRetards = list.filter((p) => p.statut === 'RETARD' || p.statut === 'retard').length;
  const tauxPresence = list.length > 0 ? Math.round((nbPresents / list.length) * 100) : 0;

  const handleSave = async () => {
    if (!form.personnelId) {
      return;
    }
    setSaving(true);
    try {
      await createPointage.mutateAsync({
        personnelId: form.personnelId,
        statut: form.statut,
        heureArrivee: form.heureArrivee || undefined,
        heureDepart: form.heureDepart || undefined,
        methode: form.methode,
        observations: form.observations || undefined,
        date: selectedDate,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch { /* hook handles toast */ }
    finally { setSaving(false); }
  };

  const handleExport = () => {
    const rows = [['Personnel', 'Poste', 'Date', 'Arrivée', 'Départ', 'Statut', 'Méthode', 'Heures']];
    list.forEach((p) => {
      rows.push([
        getPersonnelLabel(p),
        getPosteLabel(p),
        formatDateFr(p.date ?? p.datePointage ?? selectedDate, selectedDate),
        String(p.arrivee ?? p.heureArrivee ?? '—'),
        String(p.depart ?? p.heureDepart ?? '—'),
        String(p.statut ?? ''),
        METHODE_LABELS[String(p.methode ?? '')] ?? String(p.methode ?? ''),
        String(p.heures ?? ''),
      ]);
    });
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointages_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Pointages du personnel</div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', width: 220 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Exporter CSV
          </button>
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }} style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Pointer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Présents', count: nbPresents, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Absents', count: nbAbsents, bg: '#fee2e2', color: '#dc2626' },
          { label: 'Retards', count: nbRetards, bg: '#fef3c7', color: '#d97706' },
          { label: 'Taux de présence', count: `${tauxPresence}%`, bg: '#eff6ff', color: '#2563eb' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 100px 100px 110px 100px 70px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 840 }}>
            {['Personnel', 'Poste', 'Date', 'Arrivée', 'Départ', 'Statut', 'Méthode', 'Heures'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {list.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun pointage pour cette date</div>
          )}
          {list.map((p, idx) => {
            const statut = String(p.statut ?? 'PRESENT');
            const st = STATUT_MAP[statut] ?? STATUT_MAP.PRESENT;
            const name = getPersonnelLabel(p);
            return (
              <div
                key={String(p.id ?? idx)}
                onClick={() => setDetailItem(p)}
                style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 100px 100px 110px 100px 70px', padding: '12px 18px', borderBottom: idx < list.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', cursor: 'pointer', minWidth: 840 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {initials(name)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#475569' }}>{getPosteLabel(p)}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{formatDateFr(p.date ?? p.datePointage ?? selectedDate, selectedDate)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{String(p.arrivee ?? p.heureArrivee ?? '—')}</span>
                <span style={{ fontSize: 13, color: '#475569' }}>{String(p.depart ?? p.heureDepart ?? '—')}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{METHODE_LABELS[String(p.methode ?? '')] ?? String(p.methode ?? '—')}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{String(p.heures ?? '—')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Enregistrer un pointage</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Personnel *</label>
              {rawPersonnel.length > 0 ? (
                <select value={form.personnelId} onChange={(e) => setForm((f) => ({ ...f, personnelId: e.target.value }))} style={{ ...inp() }}>
                  <option value="">— Choisir un membre du personnel —</option>
                  {(rawPersonnel as Record<string, unknown>[]).map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {`${p.prenom ?? ''} ${p.nom ?? ''}`.trim()} {p.poste ? `— ${p.poste}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.personnelId} onChange={(e) => setForm((f) => ({ ...f, personnelId: e.target.value }))} style={inp()} placeholder="Nom ou matricule du personnel" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Statut *</label>
                <select value={form.statut} onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))} style={{ ...inp() }}>
                  <option value="PRESENT">Présent</option>
                  <option value="ABSENT">Absent</option>
                  <option value="RETARD">Retard</option>
                  <option value="DEMI_JOURNEE">Demi-journée</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Méthode de pointage</label>
                <select value={form.methode} onChange={(e) => setForm((f) => ({ ...f, methode: e.target.value }))} style={{ ...inp() }}>
                  <option value="MANUEL">Manuel</option>
                  <option value="BADGE">Badge</option>
                  <option value="BIOMETRIE">Biométrie</option>
                  <option value="QR_CODE">QR Code</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Heure d'arrivée</label>
                <input type="time" value={form.heureArrivee} onChange={(e) => setForm((f) => ({ ...f, heureArrivee: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={lbl()}>Heure de départ</label>
                <input type="time" value={form.heureDepart} onChange={(e) => setForm((f) => ({ ...f, heureDepart: e.target.value }))} style={inp()} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl()}>Observations</label>
              <textarea value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Motif d'absence, remarques…" />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.personnelId} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving || !form.personnelId ? 0.6 : 1 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetailItem(null)}>
          <div style={{ background: '#fff', width: 400, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Détail du pointage</div>
            {[
              ['Personnel', getPersonnelLabel(detailItem)],
              ['Poste', getPosteLabel(detailItem)],
              ['Date', String(detailItem.date ?? selectedDate)],
              ['Statut', STATUT_MAP[String(detailItem.statut ?? '')]?.label ?? String(detailItem.statut ?? '—')],
              ['Heure d\'arrivée', String(detailItem.arrivee ?? detailItem.heureArrivee ?? '—')],
              ['Heure de départ', String(detailItem.depart ?? detailItem.heureDepart ?? '—')],
              ['Heures travaillées', String(detailItem.heures ?? '—')],
              ['Méthode', METHODE_LABELS[String(detailItem.methode ?? '')] ?? String(detailItem.methode ?? '—')],
              ['Observations', String(detailItem.observations ?? '—')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#64748b', fontWeight: 600, minWidth: 130 }}>{k}</span>
                <span style={{ color: '#0f172a' }}>{v}</span>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 20 }}>
              <button onClick={() => setDetailItem(null)} style={{ height: 36, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
