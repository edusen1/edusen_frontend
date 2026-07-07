'use client';

import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function AppHeader({ onMenuClick, title = 'Tableau de bord' }: AppHeaderProps) {
  const { user, clearSession } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const initials = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}` : 'U';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate lg:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
            3
          </Badge>
        </Button>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 h-9 rounded-md hover:bg-slate-100 transition-colors outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-slate-700">
                {user?.prenom}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
