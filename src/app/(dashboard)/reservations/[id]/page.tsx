import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { approveReservation, rejectReservation, changeReservationTable, changeReservationClient } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ReservationQRCode } from '@/components/qr-code';
import { notFound } from 'next/navigation';

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const reservation = (await db.reservations.getAll()).find(r => r.id === id);

  if (!reservation) notFound();

  const client = (await db.clients.getAll()).find(c => c.id === reservation.clientId);
  const table = (await db.tables.getAll()).find(t => t.id === reservation.tableId);
  const allTables = await db.tables.getAll();
  const allClients = await db.clients.getAll();

  const canApprove = ['admin', 'approver'].includes(user?.role || '') && reservation.status === 'pending';
  const canEdit = ['admin', 'promoter'].includes(user?.role || '') && reservation.status === 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Detalles de la Reserva</h1>
        <Badge variant={
          reservation.status === 'approved' ? 'default' :
          reservation.status === 'pending' ? 'secondary' :
          'destructive'
        } className="text-lg">
          {reservation.status === 'approved' ? 'APROBADA' : reservation.status === 'pending' ? 'PENDIENTE' : 'RECHAZADA'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-semibold text-lg text-primary">{client?.name}</div>
            <div className="text-muted-foreground">{client?.phone}</div>
            {client?.isVip && <Badge variant="secondary">Cliente VIP</Badge>}
          </CardContent>
          {canEdit && (
            <CardFooter>
              <form action={changeReservationClient.bind(null, reservation.id)} className="w-full space-y-2">
                <Label htmlFor="clientId">Transferir a otro cliente</Label>
                <div className="flex gap-2">
                  <Select name="clientId" required>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.isVip ? '(VIP)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="outline" size="sm">Cambiar</Button>
                </div>
              </form>
            </CardFooter>
          )}
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Información de la Mesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-semibold text-lg text-primary">{table?.name}</div>
            <div className="text-muted-foreground">{table?.location}</div>
            <div>Capacidad: {table?.capacity} personas</div>
          </CardContent>
          {canEdit && (
            <CardFooter>
              <form action={changeReservationTable.bind(null, reservation.id)} className="w-full space-y-2">
                <Label htmlFor="tableId">Cambiar mesa</Label>
                <div className="flex gap-2">
                  <Select name="tableId" required>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Seleccionar mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.location}) - Cap: {t.capacity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="outline" size="sm">Cambiar</Button>
                </div>
              </form>
            </CardFooter>
          )}
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Info de Reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-muted-foreground">Fecha y Hora</span>
            <span className="font-medium">{new Date(reservation.date).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-muted-foreground">Creado Por</span>
            <span className="font-medium">ID Usuario: {reservation.createdBy}</span>
          </div>
          
          {reservation.status === 'approved' && reservation.qrCode && (
            <div className="flex flex-col items-center pt-4">
              <p className="mb-4 font-semibold text-primary">Ticket de Entrada</p>
              <ReservationQRCode value={reservation.qrCode} />
            </div>
          )}
        </CardContent>
        
        {canApprove && (
          <CardFooter className="flex justify-end gap-4 pt-4">
            <form action={rejectReservation.bind(null, reservation.id)}>
              <Button variant="destructive">Rechazar</Button>
            </form>
            <form action={approveReservation.bind(null, reservation.id)}>
              <Button variant="default" className="bg-primary hover:bg-primary/90">Aprobar & Generar QR</Button>
            </form>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
