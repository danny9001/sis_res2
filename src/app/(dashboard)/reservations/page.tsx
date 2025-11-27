import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();
  const allReservations = await db.reservations.getAll();
  const clients = await db.clients.getAll();
  const tables = await db.tables.getAll();

  // Simple join
  const reservations = allReservations.map(r => ({
    ...r,
    client: clients.find(c => c.id === r.clientId),
    table: tables.find(t => t.id === r.tableId),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredReservations = searchParams.status
    ? reservations.filter(r => r.status === searchParams.status)
    : reservations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Reservas</h1>
        {['promoter', 'admin'].includes(user?.role || '') && (
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/reservations/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Link>
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant={!searchParams.status ? 'default' : 'outline'} asChild>
          <Link href="/reservations">Todas</Link>
        </Button>
        <Button variant={searchParams.status === 'pending' ? 'default' : 'outline'} asChild>
          <Link href="/reservations?status=pending">Pendientes</Link>
        </Button>
        <Button variant={searchParams.status === 'approved' ? 'default' : 'outline'} asChild>
          <Link href="/reservations?status=approved">Aprobadas</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredReservations.map((r) => (
          <Card key={r.id} className="glass-panel">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <div className="font-semibold text-primary">
                  {r.client?.name || 'Cliente Desconocido'}
                  {r.client?.isVip && <Badge variant="secondary" className="ml-2">VIP</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(r.date).toLocaleString()} • {r.table?.name || 'Mesa Desconocida'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={
                  r.status === 'approved' ? 'default' :
                  r.status === 'pending' ? 'secondary' :
                  'destructive'
                }>
                  {r.status === 'approved' ? 'APROBADA' : r.status === 'pending' ? 'PENDIENTE' : 'RECHAZADA'}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/reservations/${r.id}`}>Ver</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredReservations.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No se encontraron reservas.
          </div>
        )}
      </div>
    </div>
  );
}
