import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ShuttleTicketProps {
  bookingRef: string;
  routeName: string;
  origin: string;
  destination: string;
  departure: string;
  seatCount: number;
  guestName: string;
  guestPhone: string;
  totalFare: number;
  paymentStatus: string;
  pickupPointName?: string;
}

export default function ShuttleTicket({
  bookingRef,
  routeName,
  origin,
  destination,
  departure,
  seatCount,
  guestName,
  guestPhone,
  totalFare,
  paymentStatus,
  pickupPointName,
}: ShuttleTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      // Lazy load html2canvas only when needed
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `PYU-GO-Ticket-${bookingRef}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={ticketRef}
        className="bg-white text-black rounded-2xl overflow-hidden shadow-lg mx-auto max-w-sm"
      >
        <div
          className="px-6 py-4 text-center"
          style={{ background: "linear-gradient(135deg, #22c55e, #06b6d4)" }}
        >
          <h3 className="text-white font-extrabold text-lg tracking-wide">PYU GO</h3>
          <p className="text-white/80 text-xs">Shuttle E-Ticket</p>
        </div>

        <div className="flex justify-center py-5">
          <QRCodeSVG value={bookingRef} size={140} level="H" />
        </div>

        <p className="text-center font-mono font-bold text-lg tracking-widest text-emerald-600">
          {bookingRef}
        </p>

        <div className="border-t-2 border-dashed border-gray-200 mx-6 my-4" />

        <div className="px-6 pb-5 space-y-2 text-sm">
          <Row label="Route" value={routeName} />
          <Row label="From" value={origin} />
          <Row label="To" value={destination} />
          {pickupPointName && <Row label="Pickup" value={pickupPointName} />}
          <Row label="Departure" value={departure} />
          <Row label="Seats" value={String(seatCount)} />
          <Row label="Passenger" value={guestName} />
          <Row label="Phone" value={guestPhone} />
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>Rp {totalFare.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Payment</span>
            <span
              className={
                paymentStatus === "paid"
                  ? "text-emerald-600 font-semibold"
                  : "text-orange-500 font-semibold"
              }
            >
              {paymentStatus === "paid" ? "PAID" : paymentStatus === "pending" ? "PENDING" : "UNPAID"}
            </span>
          </div>
        </div>
      </div>

      <Button onClick={handleDownload} disabled={isDownloading} className="w-full gradient-primary text-primary-foreground font-bold">
        {isDownloading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {isDownloading ? "Downloading..." : "Download Ticket"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
