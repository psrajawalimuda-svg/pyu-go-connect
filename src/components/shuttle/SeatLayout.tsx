import React, { useMemo, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Armchair, Info, Luggage } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VehicleLayout } from "@/services/ShuttleLayoutService";

export type SeatStatus = "available" | "reserved" | "booked" | "selected" | "driver";

export interface SeatInfo {
  id: string;
  number: string;
  status: SeatStatus;
}

interface SeatItemProps {
  seatNumber: string;
  isDriver?: boolean;
  absoluteStyles?: React.CSSProperties;
  seatClass?: string;
  status: SeatStatus;
  onClick: () => void;
}

const SeatItem = memo(({ seatNumber, isDriver, absoluteStyles, seatClass, status, onClick }: SeatItemProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={status === "booked" || status === "reserved" || status === "driver"}
          onClick={onClick}
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 border-2 relative",
            status === "available" && "bg-background border-muted hover:border-primary hover:bg-primary/5",
            status === "selected" && "bg-primary border-primary text-primary-foreground scale-105 shadow-md",
            status === "booked" && "bg-muted border-muted-foreground/20 cursor-not-allowed opacity-60",
            status === "reserved" && "bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed",
            status === "driver" && "bg-secondary/40 border-secondary text-secondary-foreground cursor-not-allowed",
            seatClass === "VIP" && status === "available" && "border-blue-400 bg-blue-50",
            seatClass === "Executive" && status === "available" && "border-green-400 bg-green-50"
          )}
          style={absoluteStyles}
        >
          <Armchair className={cn("w-5 h-5 sm:w-6 sm:h-6", status === "driver" && "opacity-50")} />
          <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">{isDriver ? "DRV" : seatNumber}</span>
          {status === "booked" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
              <div className="w-full h-0.5 bg-red-500/50 rotate-45" />
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-semibold capitalize">
          {isDriver ? "Driver Seat" : `Seat ${seatNumber}: ${status} ${seatClass ? `(${seatClass})` : ""}`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

SeatItem.displayName = "SeatItem";

interface SeatLayoutProps {
  vehicleType: string;
  seats: SeatInfo[];
  onSeatSelect: (seat: SeatInfo) => void;
  selectedSeats: string[];
  layoutData?: VehicleLayout | null;
}

export function SeatLayout({ vehicleType, seats, onSeatSelect, selectedSeats, layoutData }: SeatLayoutProps) {
  const normalizedVehicleType = vehicleType.toUpperCase();

  const seatMap = useMemo(() => {
    const map = new Map<string, SeatInfo>();
    seats.forEach(s => {
      map.set(s.number, s);
      map.set(s.number.padStart(2, '0'), s);
      map.set(s.number.replace(/^0+/, ''), s);
    });
    return map;
  }, [seats]);

  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const handleItemClick = useCallback((seatNumber: string) => {
    const seatData = seatMap.get(seatNumber);
    if (seatData) onSeatSelect(seatData);
  }, [seatMap, onSeatSelect]);

  const renderSeat = (seatNumber: string, isDriver: boolean = false, absoluteStyles?: React.CSSProperties, seatClass?: string) => {
    const seatData = seatMap.get(seatNumber);
    const isSelected = selectedSet.has(seatNumber) || selectedSet.has(seatNumber.padStart(2, '0'));
    const status = isDriver ? "driver" : (isSelected ? "selected" : (seatData?.status || "available"));

    return (
      <SeatItem
        key={seatNumber}
        seatNumber={seatNumber}
        isDriver={isDriver}
        absoluteStyles={absoluteStyles}
        seatClass={seatClass}
        status={status}
        onClick={() => handleItemClick(seatNumber)}
      />
    );
  };

  const renderLayout = () => {
    if (layoutData) {
      return (
        <div 
          className="relative bg-accent/30 rounded-3xl border-4 border-accent mx-auto overflow-hidden shadow-inner"
          style={{ width: layoutData.dimensions.width, height: layoutData.dimensions.height }}
        >
          <div className="absolute top-0 left-0 w-full h-8 bg-accent/50 rounded-t-3xl flex items-center justify-center">
            <div className="w-1/3 h-1 bg-accent/80 rounded-full" />
          </div>

          {layoutData.layout_data.seats.map((seat) => (
            renderSeat(
              seat.number, 
              seat.type === "Driver", 
              { position: 'absolute', left: seat.x, top: seat.y },
              seat.class
            )
          ))}

          {layoutData.layout_data.objects.map((obj) => (
            <div
              key={obj.id}
              className={cn(
                "absolute flex items-center justify-center border-2 border-dashed rounded-lg opacity-80",
                obj.type === "Baggage" ? "bg-orange-100 border-orange-300 text-orange-600" : "bg-slate-200 border-slate-400 text-slate-600"
              )}
              style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height }}
            >
              {obj.type === "Baggage" ? <Luggage size={16} /> : <span className="text-[8px] font-bold uppercase">{obj.label || obj.type}</span>}
            </div>
          ))}
        </div>
      );
    }

    switch (normalizedVehicleType) {
      case "SUV":
        return (
          <div className="flex flex-col gap-6 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[280px] mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-12 bg-accent/50 rounded-t-3xl flex items-center justify-center border-b border-accent/20">
              <div className="w-1/3 h-1.5 bg-accent/80 rounded-full" />
              <div className="absolute right-8 top-4 w-12 h-4 border-2 border-slate-400 rounded-full opacity-40" />
            </div>
            <div className="flex justify-between w-full px-2 sm:px-4 mt-8">
              {renderSeat("1")}
              {renderSeat("D", true)}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("2")}
              {renderSeat("3")}
              {renderSeat("4")}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("5")}
              {renderSeat("6")}
              {renderSeat("7")}
            </div>
            <div className="w-full py-4 bg-accent/50 rounded-xl flex items-center justify-center border-2 border-dashed border-accent">
              <Luggage className="w-5 h-5 text-muted-foreground mr-2 opacity-50" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bagasi</span>
            </div>
          </div>
        );
      case "MINI_CAR":
      case "MINICAR":
        return (
          <div className="flex flex-col gap-6 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[240px] mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-12 bg-accent/50 rounded-t-3xl flex items-center justify-center border-b border-accent/20">
              <div className="w-1/3 h-1.5 bg-accent/80 rounded-full" />
              <div className="absolute right-6 top-4 w-10 h-3.5 border-2 border-slate-400 rounded-full opacity-40" />
            </div>
            <div className="flex justify-between w-full px-2 sm:px-4 mt-8">
              {renderSeat("1")}
              {renderSeat("D", true)}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("2")}
              {renderSeat("3")}
              {renderSeat("4")}
            </div>
            <div className="w-full py-5 bg-accent/50 rounded-xl flex items-center justify-center border-2 border-dashed border-accent">
              <Luggage className="w-5 h-5 text-muted-foreground mr-2 opacity-50" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bagasi</span>
            </div>
          </div>
        );
      case "HIACE":
        return (
          <div className="flex flex-col gap-3 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[340px] mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-12 bg-accent/50 rounded-t-3xl flex items-center justify-center border-b border-accent/20">
              <div className="w-1/3 h-1.5 bg-accent/80 rounded-full" />
              <div className="absolute right-10 top-4 w-14 h-4.5 border-2 border-slate-400 rounded-full opacity-40" />
            </div>
            <div className="flex justify-between w-full px-2 sm:px-4 mb-1 mt-8">
              {renderSeat("1")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" />
              {renderSeat("D", true)}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("2")}
              {renderSeat("3")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" />
              {renderSeat("4")}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("5")}
              {renderSeat("6")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" />
              {renderSeat("7")}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("8")}
              {renderSeat("9")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" />
              {renderSeat("10")}
            </div>
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("11")}
              {renderSeat("12")}
              {renderSeat("13")}
              {renderSeat("14")}
            </div>
            <div className="w-full py-3 bg-accent/50 rounded-b-xl flex items-center justify-center border-2 border-dashed border-accent mt-2">
              <Luggage className="w-4 h-4 text-muted-foreground mr-2 opacity-50" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bagasi</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8 text-center border-2 border-dashed rounded-xl">
            <p className="text-sm text-muted-foreground">Layout kendaraan "{vehicleType}" belum tersedia</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full py-8 bg-card rounded-2xl shadow-inner border">
        <div className="flex items-center justify-center gap-6 mb-8 px-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-background border border-muted" />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted opacity-60" />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary/40 border border-secondary" />
            <span className="text-[10px] font-medium uppercase tracking-tighter">Driver</span>
          </div>
        </div>
        
        {renderLayout()}
        
        <div className="mt-8 px-6 py-3 bg-primary/5 border-y border-primary/10 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Pilih kursi yang tersedia. Kursi yang Anda pilih akan <span className="text-primary font-bold">terkunci selama 10 menit</span> untuk proses pembayaran.
          </p>
        </div>
      </div>
  );
}
