import React from "react";
import { cn } from "@/lib/utils";
import { Armchair, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type SeatStatus = "available" | "reserved" | "booked" | "selected" | "driver";

export interface SeatInfo {
  id: string;
  number: string;
  status: SeatStatus;
}

interface SeatLayoutProps {
  vehicleType: "SUV" | "MiniCar" | "Hiace" | "MINI_CAR";
  seats: SeatInfo[];
  onSeatSelect: (seat: SeatInfo) => void;
  selectedSeats: string[];
}

/**
 * SeatLayout Component
 * 
 * Visualizes the vehicle seat layout (SUV, MiniCar, Hiace) based on user's 
 * requirements from provided image.
 */
export function SeatLayout({ vehicleType, seats, onSeatSelect, selectedSeats }: SeatLayoutProps) {
  
  const normalizedVehicleType = vehicleType === "MINI_CAR" ? "MiniCar" : vehicleType;

  const renderSeat = (seatNumber: string, isDriver: boolean = false) => {
    // Handle both "1" and "01" seat numbers
    const seatData = seats.find(s => 
      s.number === seatNumber || 
      s.number === seatNumber.padStart(2, '0') ||
      seatNumber === s.number.replace(/^0+/, '')
    );
    const isSelected = selectedSeats.includes(seatNumber) || 
                       selectedSeats.includes(seatNumber.padStart(2, '0'));
    
    const status = isDriver ? "driver" : (isSelected ? "selected" : (seatData?.status || "available"));

    return (
      <TooltipProvider key={seatNumber}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={status === "booked" || status === "reserved" || status === "driver"}
              onClick={() => seatData && onSeatSelect(seatData)}
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 border-2 relative",
                status === "available" && "bg-background border-muted hover:border-primary hover:bg-primary/5",
                status === "selected" && "bg-primary border-primary text-primary-foreground scale-105 shadow-md",
                status === "booked" && "bg-muted border-muted-foreground/20 cursor-not-allowed opacity-60",
                status === "reserved" && "bg-yellow-100 border-yellow-400 text-yellow-700 cursor-not-allowed",
                status === "driver" && "bg-secondary/40 border-secondary text-secondary-foreground cursor-not-allowed"
              )}
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
              {isDriver ? "Driver Seat" : `Seat ${seatNumber}: ${status}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderLayout = () => {
    switch (normalizedVehicleType) {
      case "SUV":
        return (
          <div className="flex flex-col gap-6 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[280px] mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-accent/50 rounded-t-full" />
            {/* Front Row */}
            <div className="flex justify-between w-full px-2 sm:px-4">
              {renderSeat("1")}
              {renderSeat("D", true)}
            </div>
            {/* Middle Row */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("2")}
              {renderSeat("3")}
              {renderSeat("4")}
            </div>
            {/* Back Row */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("5")}
              {renderSeat("6")}
              {renderSeat("7")}
            </div>
            {/* Baggage Row */}
            <div className="w-full py-3 bg-accent/50 rounded-xl flex items-center justify-center border-2 border-dashed border-accent">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bagasi</span>
            </div>
          </div>
        );
      case "MiniCar":
        return (
          <div className="flex flex-col gap-6 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[240px] mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-accent/50 rounded-t-full" />
            {/* Front Row */}
            <div className="flex justify-between w-full px-2 sm:px-4">
              {renderSeat("1")}
              {renderSeat("D", true)}
            </div>
            {/* Middle Row */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-2">
              {renderSeat("2")}
              {renderSeat("3")}
              {renderSeat("4")}
            </div>
            {/* Back Row (Baggage Area) */}
            <div className="w-full py-4 bg-accent/50 rounded-xl flex items-center justify-center border-2 border-dashed border-accent">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bagasi</span>
            </div>
          </div>
        );
      case "Hiace":
        return (
          <div className="flex flex-col gap-3 items-center p-4 sm:p-6 bg-accent/30 rounded-3xl border-4 border-accent w-full max-w-[340px] mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-4 bg-accent/50 rounded-t-full" />
            {/* Row 1: Driver & 1 Seat */}
            <div className="flex justify-between w-full px-2 sm:px-4 mb-1">
              {renderSeat("1")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" /> {/* Gap */}
              {renderSeat("D", true)}
            </div>
            {/* Row 2: 3 Seats */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("2")}
              {renderSeat("3")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" /> {/* Aisle */}
              {renderSeat("4")}
            </div>
            {/* Row 3: 3 Seats */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("5")}
              {renderSeat("6")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" /> {/* Aisle */}
              {renderSeat("7")}
            </div>
            {/* Row 4: 3 Seats */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("8")}
              {renderSeat("9")}
              <div className="w-10 sm:w-12 h-10 sm:h-12" /> {/* Aisle */}
              {renderSeat("10")}
            </div>
            {/* Row 5: 4 Seats (Back Row) */}
            <div className="flex justify-between w-full px-1 sm:px-2 gap-1">
              {renderSeat("11")}
              {renderSeat("12")}
              {renderSeat("13")}
              {renderSeat("14")}
            </div>
            {/* Baggage Area */}
            <div className="w-full py-2 bg-accent/50 rounded-b-xl flex items-center justify-center border-2 border-dashed border-accent mt-2">
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
