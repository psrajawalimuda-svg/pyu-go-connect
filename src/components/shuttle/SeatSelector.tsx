import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeatLayout, SeatInfo } from "./SeatLayout";
import { format } from "date-fns";

interface SeatSelectorProps {
  selectedRoute: any;
  selectedScheduleDeparture: string;
  selectedPickupPoint: any;
  selectedSchedule: any;
  scheduleSeats: SeatInfo[];
  selectedSeats: string[];
  totalFare: number;
  onSeatClick: (seat: any) => void;
  onConfirmSeats: () => void;
  onBack: () => void;
}

export function SeatSelector({
  selectedRoute,
  selectedScheduleDeparture,
  selectedPickupPoint,
  selectedSchedule,
  scheduleSeats,
  selectedSeats,
  totalFare,
  onSeatClick,
  onConfirmSeats,
  onBack
}: SeatSelectorProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Kursi</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.name} • {format(new Date(selectedScheduleDeparture), "dd MMM yyyy, HH:mm")}
            {selectedPickupPoint && ` • 📍 ${selectedPickupPoint.name}`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <SeatLayout 
            vehicleType={selectedSchedule?.vehicle_type ?? "SUV"}
            seats={scheduleSeats || []}
            selectedSeats={selectedSeats}
            onSeatSelect={onSeatClick}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Kursi dipilih ({selectedSeats.length})</span>
            <span className="font-bold">{selectedSeats.join(", ") || "-"}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Biaya</span>
            <span className="font-extrabold text-lg text-primary">Rp {totalFare.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>Kembali</Button>
            <Button 
              className="flex-1 gradient-primary text-primary-foreground font-bold" 
              onClick={onConfirmSeats}
              disabled={selectedSeats.length === 0}
            >
              Lanjut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
