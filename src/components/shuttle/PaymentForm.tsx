import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, CreditCard, Loader2 } from "lucide-react";

interface PaymentFormProps {
  totalFare: number;
  seatCount: number;
  booking: boolean;
  processingPayment: boolean;
  onPayCash: () => void;
  onPayOnline: (gateway: "midtrans" | "xendit") => void;
  onBack: () => void;
}

export function PaymentForm({
  totalFare,
  seatCount,
  booking,
  processingPayment,
  onPayCash,
  onPayOnline,
  onBack
}: PaymentFormProps) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Metode Pembayaran</CardTitle>
          <p className="text-xs text-muted-foreground">Total: <span className="font-bold text-primary">Rp {totalFare.toLocaleString("id-ID")}</span> ({seatCount} Kursi)</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <button onClick={onPayCash} disabled={booking || processingPayment}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Banknote className="w-5 h-5 text-primary" /></div>
            <div className="text-left flex-1"><p className="font-bold text-sm">Bayar Tunai</p><p className="text-[10px] text-muted-foreground">Bayar ke sopir saat berangkat</p></div>
          </button>
          <button onClick={() => onPayOnline("midtrans")} disabled={booking || processingPayment}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-secondary" /></div>
            <div className="text-left flex-1"><p className="font-bold text-sm">QRIS / E-Wallet / VA</p><p className="text-[10px] text-muted-foreground">Otomatis Terkonfirmasi</p></div>
          </button>
          <button onClick={() => onPayOnline("xendit")} disabled={booking || processingPayment}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-primary hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-secondary" /></div>
            <div className="text-left flex-1"><p className="font-bold text-sm">Bank Transfer / OVO</p><p className="text-[10px] text-muted-foreground">Pembayaran Instan</p></div>
          </button>
          {(booking || processingPayment) && <div className="flex justify-center py-2"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          <Button variant="outline" className="w-full h-11" onClick={onBack}>Kembali</Button>
        </CardContent>
      </Card>
    </div>
  );
}
