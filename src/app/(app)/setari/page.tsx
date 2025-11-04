import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SetariPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Setări</h1>
        <p className="text-muted-foreground">Configurați aplicația conform necesităților dumneavoastră.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informații aplicație</CardTitle>
          <CardDescription>Detalii despre FleetCare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Versiune</span>
            <span className="text-sm text-muted-foreground">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Autentificare</span>
            <span className="text-sm text-muted-foreground">Dezactivată</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Mod utilizare</span>
            <span className="text-sm text-muted-foreground">Single-user</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funcționalități viitoare</CardTitle>
          <CardDescription>Opțiuni de configurare vor fi adăugate în viitor</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Această pagină va conține setări pentru notificări, preferințe de afișare, și alte opțiuni de
            configurare.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
