import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function TablesPage() {
  const user = await getCurrentUser();
  const tables = await db.tables.getAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Mesas</h1>
        {['admin', 'promoter'].includes(user?.role || '') && (
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/tables/new">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Mesa
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.id} className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                {table.name}
              </CardTitle>
              <Badge variant={table.status === 'available' ? 'default' : 'secondary'}>
                {table.status === 'available' ? 'Disponible' : table.status === 'reserved' ? 'Reservada' : 'Ocupada'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{table.location}</div>
              <p className="text-xs text-muted-foreground">
                Capacidad: {table.capacity} personas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
