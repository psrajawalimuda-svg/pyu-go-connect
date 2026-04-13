import { Bus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ServiceTypeSelectorProps {
  serviceTypes: any[] | undefined;
  selectedRoute: any;
  selectedDate: Date | undefined;
  onSelectService: (serviceId: string) => void;
  onBack: () => void;
}

export function ServiceTypeSelector({
  serviceTypes,
  selectedRoute,
  selectedDate,
  onSelectService,
  onBack
}: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Jenis Layanan</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.name} • {selectedDate && format(selectedDate, "dd MMM yyyy")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {serviceTypes?.map((st) => (
            <button 
              key={st.id} 
              onClick={() => onSelectService(st.id)}
              className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-primary">{st.name}</h3>
                <Badge variant="outline" className="bg-primary/5">Pilih</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-semibold text-foreground">Bawaan:</span> {st.baggage_info}
              </p>
              {st.description && <p className="text-[10px] italic text-muted-foreground">{st.description}</p>}
              <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                <Bus className="w-16 h-16 -mr-4 -mb-4" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={onBack}>Kembali</Button>
    </div>
  );
}
