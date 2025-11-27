'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, CalendarDays, Armchair, Users, Settings, LogOut } from 'lucide-react';
import { User } from '@/types';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  user: User;
  className?: string;
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      label: 'Panel',
      icon: LayoutDashboard,
      href: '/dashboard',
      active: pathname === '/dashboard',
      show: true,
    },
    {
      label: 'Eventos',
      icon: CalendarDays,
      href: '/events',
      active: pathname === '/events',
      show: user.role === 'admin',
    },
    {
      label: 'Reservas',
      icon: CalendarDays,
      href: '/reservations',
      active: pathname === '/reservations',
      show: true,
    },
    {
      label: 'Mesas',
      icon: Armchair,
      href: '/tables',
      active: pathname === '/tables',
      show: ['admin', 'promoter'].includes(user.role),
    },
    {
      label: 'Clientes',
      icon: Users,
      href: '/clients',
      active: pathname === '/clients',
      show: ['admin', 'promoter'].includes(user.role),
    },
    {
      label: 'Usuarios',
      icon: Settings,
      href: '/users',
      active: pathname === '/users',
      show: user.role === 'admin',
    },
  ];

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Disco Reserve
          </h2>
          <div className="space-y-1">
            {routes.filter(r => r.show).map((route) => (
              <Button
                key={route.href}
                variant={route.active ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto">
         <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
         </Button>
      </div>
    </div>
  );
}
