import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Calendar } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') redirect('/dashboard');

  const events = await db.events.getAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Eventos</h1>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear Evento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="glass-panel border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold text-primary">
                {event.name}
              </CardTitle>
              <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                {event.status === 'active' ? 'Activo' : 'Cerrado'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                {new Date(event.date).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Mesas Totales: {event.totalTables}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
