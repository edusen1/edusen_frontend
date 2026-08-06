'use client';

import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { toast } from 'sonner';

const tenants = [
  { id: 1, nom: 'Edusen Dakar', ville: 'Dakar', pays: 'Sénégal', eleves: 1248, statut: 'actif', abonnement: 'Premium', dateCreation: '01 Sep 2022' },
  { id: 2, nom: 'Edusen Thiès', ville: 'Thiès', pays: 'Sénégal', eleves: 876, statut: 'actif', abonnement: 'Standard', dateCreation: '15 Jan 2023' },
  { id: 3, nom: 'Edusen Ziguinchor', ville: 'Ziguinchor', pays: 'Sénégal', eleves: 634, statut: 'actif', abonnement: 'Standard', dateCreation: '01 Sep 2023' },
  { id: 4, nom: 'Edusen Saint-Louis', ville: 'Saint-Louis', pays: 'Sénégal', eleves: 512, statut: 'actif', abonnement: 'Basic', dateCreation: '15 Mar 2023' },
  { id: 5, nom: 'Edusen Kaolack', ville: 'Kaolack', pays: 'Sénégal', eleves: 423, statut: 'actif', abonnement: 'Basic', dateCreation: '01 Sep 2023' },
  { id: 6, nom: 'Edusen Conakry', ville: 'Conakry', pays: 'Guinée', eleves: 320, statut: 'inactif', abonnement: 'Basic', dateCreation: '15 Jan 2024' },
];

const abonnementColor: Record<string, string> = {
  Premium: 'bg-purple-100 text-purple-700',
  Standard: 'bg-indigo-100 text-indigo-700',
  Basic: 'bg-slate-100 text-slate-600',
};

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<typeof tenants[0] | null>(null);

  const filtered = tenants.filter(
    (t) =>
      t.nom.toLowerCase().includes(search.toLowerCase()) ||
      t.ville.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Établissements"
        description={`${tenants.length} établissements sur la plateforme`}
        actions={
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditTenant(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Rechercher un établissement..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tenant) => (
          <Card key={tenant.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tenant.statut === 'actif' ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                  <Building2 className={`h-5 w-5 ${tenant.statut === 'actif' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{tenant.nom}</p>
                  <p className="text-xs text-slate-500">{tenant.ville}, {tenant.pays}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={`text-[10px] ${abonnementColor[tenant.abonnement]} hover:bg-transparent`}>{tenant.abonnement}</Badge>
                <Badge className={`text-[10px] ${tenant.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} hover:bg-transparent`}>
                  {tenant.statut === 'actif' ? (
                    <><CheckCircle2 className="mr-1 h-3 w-3" />Actif</>
                  ) : (
                    <><XCircle className="mr-1 h-3 w-3" />Inactif</>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <Users className="h-3.5 w-3.5" />
                <span>{tenant.eleves.toLocaleString()} élèves</span>
                <span className="text-slate-300">·</span>
                <span>Depuis {tenant.dateCreation}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setEditTenant(tenant); setDialogOpen(true); }}>
                  <Pencil className="mr-1 h-3 w-3" />Modifier
                </Button>
                <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => toast.success(`${tenant.nom} supprimé`)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTenant ? 'Modifier l\'établissement' : 'Nouvel établissement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Nom</Label><Input defaultValue={editTenant?.nom} placeholder="Edusen ..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Ville</Label><Input defaultValue={editTenant?.ville} placeholder="Dakar" /></div>
              <div className="space-y-1.5"><Label>Pays</Label><Input defaultValue={editTenant?.pays} placeholder="Sénégal" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Abonnement</Label>
              <Select defaultValue={editTenant?.abonnement ?? 'Basic'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { toast.success(editTenant ? 'Modifié' : 'Créé'); setDialogOpen(false); }}>
              {editTenant ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
