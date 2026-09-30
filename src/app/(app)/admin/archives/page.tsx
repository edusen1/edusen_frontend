'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type ArchiveType = 'ANNEE_SCOLAIRE' | 'BULLETIN' | 'PAIEMENT';
type DetailEntry = { label: string; total: number };

type ArchiveRow = {
  id: string;
  type: ArchiveType;
  titre: string;
  description: string;
  anneeScolaire: string;
  dateReference?: string;
  nbElements: number;
  montant?: number;
  statut?: string;
  details?: Record<string, unknown>;
};

type ArchiveDetailResponse = {
  content: Record<string, unknown>[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const TYPE_LABELS: Record<ArchiveType, string> = {
  ANNEE_SCOLAIRE: 'Année scolaire',
  BULLETIN: 'Bulletins',
  PAIEMENT: 'Paiements',
};

const TYPE_COLORS: Record<ArchiveType, string> = {
  ANNEE_SCOLAIRE: '#0f172a',
  BULLETIN: '#16a34a',
  PAIEMENT: '#d97706',
};

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
}

function formatMoney(value?: number) {
  if (!value) return '0 F';
  return `${value.toLocaleString('fr-FR')} F`;
}

function asEntries(value: unknown): DetailEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is DetailEntry => {
    return !!entry
      && typeof entry === 'object'
      && typeof (entry as DetailEntry).label === 'string'
      && typeof (entry as DetailEntry).total === 'number';
  });
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDate(value);
  return String(value);
}

function TypeMark({ type }: { type: ArchiveType }) {
  const color = TYPE_COLORS[type];
  return (
    <span
      aria-hidden
      style={{
        width: 34,
        height: 34,
        border: `1px solid ${color}30`,
        background: `${color}12`,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {type === 'ANNEE_SCOLAIRE' && <><path d="M3 4h18v16H3z" /><path d="M8 2v4M16 2v4M3 9h18" /></>}
        {type === 'BULLETIN' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>}
        {type === 'PAIEMENT' && <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M7 15h4" /></>}
      </svg>
    </span>
  );
}

function Badge({ children, color = '#475569' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: `${color}12`, border: `1px solid ${color}30`, color, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function DetailList({ title, items }: { title: string; items: DetailEntry[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.slice(0, 6).map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 12, color: '#475569' }}>
            <span>{item.label}</span>
            <strong>{item.total.toLocaleString('fr-FR')}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArchivesPage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TOUS' | ArchiveType>('TOUS');
  const [yearFilter, setYearFilter] = useState('TOUTES');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<ArchiveRow | null>(null);
  const [detailData, setDetailData] = useState<ArchiveDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/admin/archives');
        const content = Array.isArray(response.data?.content) ? response.data.content as ArchiveRow[] : [];
        if (!cancelled) setRows(content);
      } catch {
        if (!cancelled) setError('Impossible de charger les archives.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!detail) return;
    let cancelled = false;
    const archiveId = detail.id;
    async function loadDetails() {
      setDetailLoading(true);
      setDetailError('');
      try {
        const response = await apiClient.get(`/admin/archives/${archiveId}`, {
          params: { page: detailPage, size: 10, search: detailSearch.trim() || undefined },
        });
        if (!cancelled) setDetailData(response.data as ArchiveDetailResponse);
      } catch {
        if (!cancelled) setDetailError('Impossible de charger le détail de cette archive.');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void loadDetails();
    return () => { cancelled = true; };
  }, [detail, detailPage, detailSearch]);

  function openDetail(row: ArchiveRow) {
    setDetail(row);
    setDetailData(null);
    setDetailError('');
    setDetailSearch('');
    setDetailPage(0);
  }

  const years = useMemo(() => [...new Set(rows.map((row) => row.anneeScolaire))].sort().reverse(), [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== 'TOUS' && row.type !== typeFilter) return false;
      if (yearFilter !== 'TOUTES' && row.anneeScolaire !== yearFilter) return false;
      if (query && !`${row.titre} ${row.description} ${row.anneeScolaire}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [rows, search, typeFilter, yearFilter]);

  const stats = {
    total: rows.length,
    annees: rows.filter((row) => row.type === 'ANNEE_SCOLAIRE').length,
    bulletins: rows.filter((row) => row.type === 'BULLETIN').reduce((sum, row) => sum + row.nbElements, 0),
    paiements: rows.filter((row) => row.type === 'PAIEMENT').reduce((sum, row) => sum + row.nbElements, 0),
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Archives</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Consultation des données historiques disponibles</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', fontSize: 12, color: '#475569' }}>
          Lecture seule
        </div>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Archives', value: stats.total, color: '#0f172a' },
            { label: 'Années clôturées', value: stats.annees, color: '#475569' },
            { label: 'Bulletins', value: stats.bulletins.toLocaleString('fr-FR'), color: '#16a34a' },
            { label: 'Paiements', value: stats.paiements.toLocaleString('fr-FR'), color: '#d97706' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une archive" style={{ height: 36, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 13, flex: 1, fontFamily: 'inherit' }} />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'TOUS' | ArchiveType)} style={{ height: 36, border: '1px solid #e2e8f0', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="TOUS">Tous les types</option>
              {(Object.keys(TYPE_LABELS) as ArchiveType[]).map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
            </select>
            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} style={{ height: 36, border: '1px solid #e2e8f0', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="TOUTES">Toutes les années</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <div style={{ fontSize: 12, color: '#64748b', minWidth: 90, textAlign: 'right' }}>{filtered.length} résultat(s)</div>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: 16, fontSize: 13 }}>{error}</div>}

        {loading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement des archives...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Aucune archive disponible</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Les archives apparaîtront ici dès que des années clôturées, bulletins ou paiements historiques seront disponibles.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((row) => (
              <div key={row.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <TypeMark type={row.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{row.titre}</span>
                      <Badge color={TYPE_COLORS[row.type]}>{TYPE_LABELS[row.type]}</Badge>
                      <Badge>{row.anneeScolaire}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{row.description}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>{row.nbElements.toLocaleString('fr-FR')} élément(s)</span>
                      {row.montant !== undefined && <span>{formatMoney(row.montant)}</span>}
                      <span>Référence : {formatDate(row.dateReference)}</span>
                      {row.statut && <span>Statut : {row.statut}</span>}
                    </div>
                  </div>
                  <button onClick={() => openDetail(row)} style={{ height: 30, padding: '0 12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: 'min(980px, 96vw)', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(15,23,42,.22)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail de l&apos;archive</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TypeMark type={detail.type} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{TYPE_LABELS[detail.type]} · {detail.anneeScolaire}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{detail.description}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px' }}>
                <div><strong>Éléments</strong><br />{detail.nbElements.toLocaleString('fr-FR')}</div>
                <div><strong>Date référence</strong><br />{formatDate(detail.dateReference)}</div>
                {detail.montant !== undefined && <div><strong>Montant</strong><br />{formatMoney(detail.montant)}</div>}
                {detail.statut && <div><strong>Statut</strong><br />{detail.statut}</div>}
              </div>
              {detail.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#475569', background: '#fff', border: '1px solid #e2e8f0', padding: '12px 14px', maxHeight: 260, overflow: 'auto' }}>
                  {detail.type === 'ANNEE_SCOLAIRE' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><strong>Début</strong><br />{formatDate(String(detail.details.dateDebut ?? ''))}</div>
                        <div><strong>Fin</strong><br />{formatDate(String(detail.details.dateFin ?? ''))}</div>
                      </div>
                      <DetailList title="Inscriptions par statut" items={asEntries(detail.details.inscriptionsParStatut)} />
                      <DetailList title="Classes" items={asEntries(detail.details.classes)} />
                      <DetailList title="Séries" items={asEntries(detail.details.series)} />
                    </>
                  )}
                  {detail.type === 'BULLETIN' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><strong>PDF générés</strong><br />{(asNumber(detail.details.bulletinsAvecPdf) ?? 0).toLocaleString('fr-FR')}</div>
                        <div><strong>Moyenne générale</strong><br />{asNumber(detail.details.moyenneGenerale)?.toLocaleString('fr-FR') ?? '—'}</div>
                      </div>
                      <DetailList title="Statuts" items={asEntries(detail.details.parStatut)} />
                      <DetailList title="Périodes" items={asEntries(detail.details.parTrimestre)} />
                      <DetailList title="Classes" items={asEntries(detail.details.classes)} />
                      <DetailList title="Séries" items={asEntries(detail.details.series)} />
                    </>
                  )}
                  {detail.type === 'PAIEMENT' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><strong>Validé</strong><br />{formatMoney(asNumber(detail.details.montantValide))}</div>
                        <div><strong>En attente</strong><br />{formatMoney(asNumber(detail.details.montantEnAttente))}</div>
                      </div>
                      <DetailList title="Statuts" items={asEntries(detail.details.parStatut)} />
                      <DetailList title="Types de paiement" items={asEntries(detail.details.parTypePaiement)} />
                      <DetailList title="Modes de paiement" items={asEntries(detail.details.parModePaiement)} />
                    </>
                  )}
                </div>
              )}
              <div style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
                <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Lignes archivées</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{detailData?.totalElements?.toLocaleString('fr-FR') ?? 0} élément(s)</div>
                  </div>
                  <input
                    value={detailSearch}
                    onChange={(event) => { setDetailSearch(event.target.value); setDetailPage(0); }}
                    placeholder="Rechercher dans le détail"
                    style={{ height: 32, width: 240, border: '1px solid #e2e8f0', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}
                  />
                </div>
                {detailError && <div style={{ padding: 16, color: '#991b1b', background: '#fef2f2', fontSize: 12 }}>{detailError}</div>}
                {detailLoading ? (
                  <div style={{ padding: 22, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Chargement du détail...</div>
                ) : !detailData || detailData.content.length === 0 ? (
                  <div style={{ padding: 22, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Aucune ligne trouvée</div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                            {(detail.type === 'PAIEMENT'
                              ? ['reference', 'eleve', 'matricule', 'montant', 'typePaiement', 'modePaiement', 'statut', 'dateReference']
                              : detail.type === 'BULLETIN'
                                ? ['eleve', 'matricule', 'classe', 'serie', 'trimestre', 'statut', 'moyenne', 'rang', 'document']
                                : ['numeroInscription', 'eleve', 'matricule', 'classe', 'serie', 'statut', 'fraisInscription', 'dateReference']
                            ).map((column) => (
                              <th key={column} style={{ padding: '9px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, whiteSpace: 'nowrap' }}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.content.map((row, index) => (
                            <tr key={String(row.id ?? index)}>
                              {(detail.type === 'PAIEMENT'
                                ? ['reference', 'eleve', 'matricule', 'montant', 'typePaiement', 'modePaiement', 'statut', 'dateReference']
                                : detail.type === 'BULLETIN'
                                  ? ['eleve', 'matricule', 'classe', 'serie', 'trimestre', 'statut', 'moyenne', 'rang', 'document']
                                  : ['numeroInscription', 'eleve', 'matricule', 'classe', 'serie', 'statut', 'fraisInscription', 'dateReference']
                              ).map((column) => (
                                <td key={column} style={{ padding: '9px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569', whiteSpace: 'nowrap' }}>
                                  {column === 'montant' || column === 'fraisInscription'
                                    ? formatMoney(asNumber(row[column]))
                                    : displayValue(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
                      <span>Page {detailData.page + 1} / {Math.max(1, detailData.totalPages)}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button disabled={detailPage <= 0} onClick={() => setDetailPage((page) => Math.max(0, page - 1))} style={{ border: '1px solid #e2e8f0', background: detailPage <= 0 ? '#f8fafc' : '#fff', color: '#475569', padding: '6px 10px', fontSize: 12, cursor: detailPage <= 0 ? 'not-allowed' : 'pointer' }}>Précédent</button>
                        <button disabled={detailData.page + 1 >= detailData.totalPages} onClick={() => setDetailPage((page) => page + 1)} style={{ border: '1px solid #e2e8f0', background: detailData.page + 1 >= detailData.totalPages ? '#f8fafc' : '#fff', color: '#475569', padding: '6px 10px', fontSize: 12, cursor: detailData.page + 1 >= detailData.totalPages ? 'not-allowed' : 'pointer' }}>Suivant</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
