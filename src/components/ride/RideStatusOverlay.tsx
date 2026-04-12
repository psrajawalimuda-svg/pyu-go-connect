
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, DollarSign, X, Loader2, Clock } from "lucide-react";
import { ServiceSelector } from "./ServiceSelector";
import { useTranslation } from "react-i18next";

interface RideStatusOverlayProps {
  rideStatus: string;
  selectingMode: "pickup" | "dropoff";
  serviceType: string;
  fare: number | null;
  fareLoading: boolean;
  distanceKm: number | null;
  durationMin: number | null;
  onReset: () => void;
  onServiceSelect: (type: any) => void;
  onRequestRide: () => void;
  onStatusChange: (status: any) => void;
}

export function RideStatusOverlay({
  rideStatus,
  selectingMode,
  serviceType,
  fare,
  fareLoading,
  distanceKm,
  durationMin,
  onReset,
  onServiceSelect,
  onRequestRide,
  onStatusChange,
}: RideStatusOverlayProps) {
  const { t } = useTranslation();

  if (rideStatus === "idle") {
    return (
      <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-10">
        <div className="bg-foreground/80 text-background text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {selectingMode === "pickup" ? t("ride.pickup") : t("ride.dropoff")}
        </div>
      </div>
    );
  }

  if (rideStatus === "selecting_service") {
    return (
      <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
        <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
          <div className="flex justify-between items-center mb-3">
            <div />
            <button onClick={onReset} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <ServiceSelector selected={serviceType as any} onSelect={onServiceSelect} loading={fareLoading} />
          {fareLoading && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("ride.calculating_fare")}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (rideStatus === "confirming" && fare) {
    return (
      <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
        <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Ride Summary</h3>
            <button onClick={onReset} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
            <span className="capitalize">{serviceType.replace("_", " ")}</span>
            {distanceKm && <span>• {distanceKm.toFixed(1)} km</span>}
            {durationMin && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{durationMin} mins
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-extrabold">Rp {fare.toLocaleString("id-ID")}</span>
            </div>
            <button onClick={() => onStatusChange("selecting_service")} className="text-xs text-primary underline">Change service</button>
          </div>
          <Button className="w-full gradient-primary text-primary-foreground font-bold" size="lg" onClick={onRequestRide}>
            <Navigation className="w-4 h-4 mr-2" /> {t("ride.request_ride")}
          </Button>
        </div>
      </div>
    );
  }

  if (rideStatus === "searching") {
    return (
      <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
        <div className="bg-card rounded-2xl p-6 shadow-xl border border-border text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
          <p className="font-bold">{t("ride.finding_driver")}</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (rideStatus === "accepted") {
    return (
      <div className="absolute bottom-20 left-4 right-4 z-10 animate-slide-up">
        <div className="bg-card rounded-2xl p-5 shadow-xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold">{t("ride.driver_found")}</p>
              <p className="text-xs text-muted-foreground">Arriving soon</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onReset}>{t("common.cancel")}</Button>
        </div>
      </div>
    );
  }

  return null;
}
