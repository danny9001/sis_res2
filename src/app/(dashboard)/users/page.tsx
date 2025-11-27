import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Shield } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') redirect('/dashboard');

  const users = await db.users.getAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold neon-text">Usuarios</h1>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Usuario
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u.id} className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                {u.name}
              </CardTitle>
              <Badge variant="outline">{u.role}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                {u.username}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
