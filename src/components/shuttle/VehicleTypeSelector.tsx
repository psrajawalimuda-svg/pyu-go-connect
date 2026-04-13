import { Bus, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface VehicleTypeSelectorProps {
  availableVehicles: string[];
  selectedRoute: any;
  selectedDate: Date | undefined;
  serviceTypeName: string | undefined;
  vehicleDetails: any;
  onSelectVehicle: (vehicleType: string) => void;
  onBack: () => void;
}

export function VehicleTypeSelector({
  availableVehicles,
  selectedRoute,
  selectedDate,
  serviceTypeName,
  vehicleDetails,
  onSelectVehicle,
  onBack
}: VehicleTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Jenis Kendaraan</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.name} • {selectedDate && format(selectedDate, "dd MMM yyyy")} • {serviceTypeName}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableVehicles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada kendaraan tersedia untuk kriteria ini</p>
          )}
          {availableVehicles.map((vt) => {
            const details = vehicleDetails[vt] || { name: vt, capacity: "?", facilities: [], icon: <Bus className="w-10 h-10" /> };
            return (
              <button 
                key={vt} 
                onClick={() => onSelectVehicle(vt)}
                className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      {details.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-primary">{details.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>Kapasitas: {details.capacity} Kursi</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/5">Pilih</Badge>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {details.facilities.map((f: string) => (
                    <span key={f} className="text-[10px] px-2 py-0.5 bg-accent rounded-full font-medium">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Bus className="w-20 h-20 -mr-6 -mb-6" />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={onBack}>Kembali</Button>
    </div>
  );
}
