'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Building2, Users, Activity, TrendingUp } from 'lucide-react';

const kpis = [
  { label: 'Établissements', value: '24', icon: Building2, trend: '+3 ce mois', color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Utilisateurs actifs', value: '18 420', icon: Users, trend: '+1 240 ce mois', color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Requêtes/jour', value: '142k', icon: Activity, trend: '+8%', color: 'text-amber-600 bg-amber-50' },
  { label: 'Taux disponibilité', value: '99.8%', icon: TrendingUp, trend: 'Ce mois', color: 'text-purple-600 bg-purple-50' },
];

const activiteData = [
  { mois: 'Jan', connexions: 12400, requetes: 98000 },
  { mois: 'Fév', connexions: 14200, requetes: 112000 },
  { mois: 'Mar', connexions: 16800, requetes: 128000 },
  { mois: 'Avr', connexions: 15200, requetes: 120000 },
  { mois: 'Mai', connexions: 17400, requetes: 135000 },
  { mois: 'Jun', connexions: 18420, requetes: 142000 },
];

const tenantsStats = [
  { nom: 'Noura School Dakar', eleves: 1248, statut: 'actif' },
  { nom: 'Noura School Thiès', eleves: 876, statut: 'actif' },
  { nom: 'Noura School Ziguinchor', eleves: 634, statut: 'actif' },
  { nom: 'Noura School Saint-Louis', eleves: 512, statut: 'actif' },
  { nom: 'Noura School Kaolack', eleves: 423, statut: 'actif' },
];

export default function PlatformStatsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Statistiques plateforme" description="Vue globale de l'infrastructure" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{kpi.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{kpi.trend}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Activité mensuelle</CardTitle>
            <CardDescription>Connexions et requêtes API</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activiteData}>
                <defs>
                  <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="connexions" name="Connexions" stroke="#4f46e5" strokeWidth={2} fill="url(#colorConn)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top établissements</CardTitle>
            <CardDescription>Classement par nombre d'élèves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenantsStats.map((t, i) => (
              <div key={t.nom}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i+1}</span>
                    <p className="text-sm font-medium text-slate-900 truncate">{t.nom}</p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">{t.eleves}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full ml-6">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(t.eleves / 1248) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
