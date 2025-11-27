import { createEvent } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewEventPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-2xl font-bold neon-text">Crear Nuevo Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Evento</Label>
              <Input id="name" name="name" placeholder="Ej. Fiesta Viernes" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="datetime-local" required className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalTables">Cantidad de Mesas Disponibles</Label>
              <Input id="totalTables" name="totalTables" type="number" min="1" required className="bg-background/50" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Crear Evento</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
