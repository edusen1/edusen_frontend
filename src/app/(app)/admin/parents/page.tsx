'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminParents, useCreateParent, useUpdateParent } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

const EMPTY_FORM = { prenom: '', nom: '', telephone: '', email: '' };

type ParentItem = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  lienParente?: string | null;
};

type ChildItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  matricule?: string | null;
  telephone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  eleveClasse?: { id: string; nom: string } | null;
};

function parentName(parent: ParentItem) {
  return `${parent.prenom} ${parent.nom}`.trim() || 'Parent';
}

function childName(child: ChildItem) {
  return `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim() || 'Élève';
}

function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—';
}

function normalizeParent(raw: Record<string, unknown>, index: number): ParentItem {
  return {
    id: String(raw.id ?? raw._id ?? index),
    nom: String(raw.nom ?? raw.lastName ?? ''),
    prenom: String(raw.prenom ?? raw.firstName ?? ''),
    telephone: String(raw.telephone ?? raw.phone ?? ''),
    email: String(raw.email ?? ''),
    lienParente: typeof raw.lienParente === 'string' ? raw.lienParente : null,
  };
}

export default function ParentsPage() {
  const { data } = useAdminParents();
  const createParent = useCreateParent();
  const updateParent = useUpdateParent();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedParent, setSelectedParent] = useState<ParentItem | null>(null);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  const parents = useMemo(() => {
    const raw = Array.isArray(data) ? data : ((data as Record<string, unknown> | undefined)?.content ?? (data as Record<string, unknown> | undefined)?.parents ?? (data as Record<string, unknown> | undefined)?.data ?? []);
    return (raw as Record<string, unknown>[]).map(normalizeParent);
  }, [data]);

  const filtered = parents.filter((parent) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return parent.nom.toLowerCase().includes(query)
      || parent.prenom.toLowerCase().includes(query)
      || parent.telephone.toLowerCase().includes(query)
      || parent.email.toLowerCase().includes(query);
  });

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (parent: ParentItem) => {
    setEditId(parent.id);
    setForm({ prenom: parent.prenom, nom: parent.nom, telephone: parent.telephone, email: parent.email });
    setShowModal(true);
  };

  const openDetails = async (parent: ParentItem) => {
    setSelectedParent(parent);
    setChildren([]);
    setChildrenLoading(true);
    try {
      const res = await apiClient.get(`/admin/parents/${parent.id}/enfants`);
      const payload = res.data as ChildItem[] | { content?: ChildItem[]; data?: ChildItem[] };
      setChildren(Array.isArray(payload) ? payload : (payload.content ?? payload.data ?? []));
    } catch {
      toast.error('Erreur chargement des enfants');
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.prenom || !form.nom || !form.telephone) return;
    if (editId) {
      updateParent.mutate({ id: editId, data: form }, { onSuccess: () => { setShowModal(false); } });
    } else {
      createParent.mutate(form, { onSuccess: () => { setShowModal(false); } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Parents</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{parents.length} parent{parents.length > 1 ? 's' : ''} inscrit{parents.length > 1 ? 's' : ''}</div>
        </div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter
        </button>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un parent…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 38, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 150px 1.2fr 120px 150px', gap: 14, padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 760 }}>
            {['Parent', 'Téléphone', 'Email', 'Lien', 'Actions'].map((header) => (
              <span key={header} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{header}</span>
            ))}
          </div>
          {filtered.map((parent, index) => (
            <div key={parent.id} onClick={() => openDetails(parent)} style={{ display: 'grid', gridTemplateColumns: '1.4fr 150px 1.2fr 120px 150px', gap: 14, padding: '12px 18px', borderBottom: index < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 760, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {initials(parent.prenom, parent.nom)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parentName(parent)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Cliquer pour voir les enfants</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#475569' }}>{parent.telephone || '—'}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{parent.email || '—'}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{parent.lienParente || '—'}</span>
              <div style={{ display: 'flex', gap: 6 }} onClick={(event) => event.stopPropagation()}>
                <button onClick={() => openDetails(parent)} style={{ height: 28, padding: '0 10px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  Détails
                </button>
                <button onClick={() => openEdit(parent)} style={{ height: 28, padding: '0 10px', border: '1px solid #e6ebf1', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  Modifier
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun parent trouvé</div>
          )}
        </div>
      </div>

      {selectedParent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', display: 'flex', justifyContent: 'flex-end', zIndex: 900 }}>
          <div style={{ width: 460, height: '100%', background: '#fff', boxShadow: '-18px 0 50px rgba(15,23,42,.18)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {initials(selectedParent.prenom, selectedParent.nom)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{parentName(selectedParent)}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Parent / Tuteur</div>
              </div>
              <button onClick={() => setSelectedParent(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>×</button>
            </div>

            <div style={{ padding: 22, borderBottom: '1px solid #eef2f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Téléphone', selectedParent.telephone || '—'],
                ['Email', selectedParent.email || '—'],
                ['Lien', selectedParent.lienParente || '—'],
                ['Enfants', String(children.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '18px 22px 10px', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Enfants élèves</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 22px' }}>
              {childrenLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
              ) : children.length === 0 ? (
                <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e6ebf1', color: '#94a3b8', fontSize: 13 }}>Aucun enfant associé à ce parent.</div>
              ) : children.map((child) => (
                <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #eef2f6' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {child.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={child.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(child.firstName, child.lastName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{childName(child)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{child.matricule || 'Sans matricule'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{child.eleveClasse?.nom ?? '—'}</div>
                    {child.telephone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{child.telephone}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier le parent' : 'Nouveau parent'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Prénom *</label>
                <input value={form.prenom} onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))} placeholder="Ibrahima" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom *</label>
                <input value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} placeholder="Diallo" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Téléphone *</label>
              <input value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} placeholder="+221 77 000 00 00" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Email (optionnel)</label>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@gmail.com" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={(createParent.isPending || updateParent.isPending) || !form.prenom || !form.nom || !form.telephone} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (!form.prenom || !form.nom || !form.telephone) ? 0.5 : 1 }}>
                {(createParent.isPending || updateParent.isPending) ? 'Enregistrement…' : (editId ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
