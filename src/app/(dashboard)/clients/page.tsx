import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, User as UserIcon } from 'lucide-react';

export default async function ClientsPage() {
  const user = await getCurrentUser();
  const clients = await db.clients.getAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Clientes</h1>
        {['admin', 'promoter'].includes(user?.role || '') && (
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                {client.name}
              </CardTitle>
              {client.isVip && <Badge variant="secondary">VIP</Badge>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <UserIcon className="h-4 w-4" />
                {client.phone}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
