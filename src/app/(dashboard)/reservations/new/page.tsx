import { db } from '@/lib/db';
import { createReservation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewReservationPage() {
  const clients = await db.clients.getAll();
  const tables = await db.tables.getAll();
  const events = (await db.events.getAll()).filter(e => e.status === 'active');

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-2xl font-bold neon-text">Nueva Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createReservation} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventId">Evento</Label>
              <Select name="eventId" required>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({new Date(event.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select name="clientId" required>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.isVip ? 'VIP' : 'Regular'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableId">Mesa</Label>
              <Select name="tableId" required>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Seleccionar mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} ({table.location}) - Cap: {table.capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Crear Solicitud</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
