import { createClient } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewClientPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Client</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="e.g. Juan Perez" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="e.g. 555-0123" required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isVip" name="isVip" />
              <Label htmlFor="isVip">VIP Client</Label>
            </div>
            <Button type="submit" className="w-full">Create Client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
