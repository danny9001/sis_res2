import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const reservations = await db.reservations.getAll();
  const tables = await db.tables.getAll();
  const clients = await db.clients.getAll();

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const approvedReservations = reservations.filter(r => r.status === 'approved');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold neon-text">Bienvenido, {user.name}</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Stats Cards */}
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReservations.length} pendientes de aprobación
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.filter(t => t.status === 'available').length} / {tables.length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role Specific Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {['promoter', 'admin'].includes(user.role) && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/reservations/new">Crear Nueva Reserva</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-primary/50 hover:bg-primary/20">
                <Link href="/clients/new">Agregar Nuevo Cliente</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {['approver', 'admin'].includes(user.role) && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Aprobaciones Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReservations.length === 0 ? (
                <p className="text-muted-foreground">No hay reservas pendientes.</p>
              ) : (
                <div className="space-y-2">
                  {pendingReservations.slice(0, 5).map(r => (
                    <div key={r.id} className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span>{new Date(r.date).toLocaleDateString()}</span>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/reservations/${r.id}`}>Revisar</Link>
                      </Button>
                    </div>
                  ))}
                  <Button asChild variant="link" className="px-0 text-primary">
                    <Link href="/reservations?status=pending">Ver todas las pendientes</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
