import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PickupSelectorProps {
  rayons: any[] | undefined;
  selectedRoute: any;
  selectedScheduleDeparture: string;
  onSelectPickupPoint: (rayon: any, point: any) => void;
  onBack: () => void;
}

export function PickupSelector({
  rayons,
  selectedRoute,
  selectedScheduleDeparture,
  onSelectPickupPoint,
  onBack
}: PickupSelectorProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Titik Jemput</CardTitle>
          <p className="text-xs text-muted-foreground">{selectedRoute?.name} • {format(new Date(selectedScheduleDeparture), "dd MMM yyyy, HH:mm")}</p>
        </CardHeader>
      </Card>
      {rayons?.map((rayon) => (
        <Card key={rayon.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{rayon.name}</CardTitle>
            {rayon.description && <p className="text-xs text-muted-foreground">{rayon.description}</p>}
          </CardHeader>
          <CardContent className="space-y-1">
            {rayon.pickup_points.map((p: any) => (
              <button key={p.id} onClick={() => onSelectPickupPoint(rayon, p)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary w-6">J{p.stop_order}</span>
                  <div>
                    <p className="text-sm font-medium text-left">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.departure_time ? `${p.departure_time} WIB` : ""} • {p.distance_meters}m</p>
                  </div>
                </div>
                <span className="font-bold text-sm text-primary">Rp {Number(p.fare).toLocaleString("id-ID")}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" className="w-full" onClick={onBack}>Kembali</Button>
    </div>
  );
}
