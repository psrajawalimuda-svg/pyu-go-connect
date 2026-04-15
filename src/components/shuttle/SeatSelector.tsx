import React, { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeatLayout, SeatInfo } from "./SeatLayout";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { VehicleLayout } from "@/services/ShuttleLayoutService";

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
  layoutData?: VehicleLayout | null;
}

export const SeatSelector = memo(({
  selectedRoute,
  selectedScheduleDeparture,
  selectedPickupPoint,
  selectedSchedule,
  scheduleSeats,
  selectedSeats,
  totalFare,
  onSeatClick,
  onConfirmSeats,
  onBack,
  layoutData
}: SeatSelectorProps) => {
  const farePerSeat = selectedSeats.length > 0 ? Math.round(totalFare / selectedSeats.length) : 0;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Kursi</CardTitle>
          <div className="space-y-2 mt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-slate-700">{selectedRoute?.name}</span>
              <br />
              {format(new Date(selectedScheduleDeparture), "dd MMM yyyy, HH:mm")}
            </p>
            {selectedPickupPoint && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary">Titik Jemput</p>
                  <p className="text-xs text-slate-600 line-clamp-1">{selectedPickupPoint.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SeatLayout 
            vehicleType={selectedSchedule?.vehicle_type ?? "SUV"}
            seats={scheduleSeats || []}
            selectedSeats={selectedSeats}
            onSeatSelect={onSeatClick}
            layoutData={layoutData}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Selected Seats */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Kursi Dipilih</p>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((seat) => (
                  <Badge key={seat} variant="secondary" className="text-xs">
                    Kursi {seat}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada kursi dipilih</p>
            )}
          </div>

          {/* Fare Breakdown */}
          <div className="space-y-1.5 pt-2 border-t">
            {selectedSeats.length > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Harga per kursi</span>
                <span className="font-semibold">Rp {farePerSeat.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Jumlah kursi</span>
              <span className="font-semibold">{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-primary">
              <span>Total Biaya</span>
              <span className="text-lg">Rp {totalFare.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Kembali
            </Button>
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
});

SeatSelector.displayName = "SeatSelector";
