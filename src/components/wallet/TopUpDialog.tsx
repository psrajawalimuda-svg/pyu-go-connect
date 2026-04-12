import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

type Gateway = "midtrans" | "xendit";

export function TopUpDialog({
  open,
  onOpenChange,
  activeGateways,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeGateways: { gateway: string; is_default: boolean }[];
}) {
  const [amount, setAmount] = useState<number>(0);
  const [gateway, setGateway] = useState<Gateway>(
    (activeGateways.find((g) => g.is_default)?.gateway as Gateway) || (activeGateways[0]?.gateway as Gateway) || "midtrans"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-load Midtrans Snap script
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (clientKey && !document.getElementById("midtrans-snap")) {
      const script = document.createElement("script");
      script.id = "midtrans-snap";
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleTopUp = async () => {
    if (amount < 10000) {
      toast.error("Minimum top-up is Rp 10,000");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-topup", {
        body: { amount, gateway },
      });

      if (error) throw error;

      if (data.gateway === "midtrans" && data.token) {
        const clientKey = data.client_key || import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
        
        if (!clientKey) {
          toast.error("Payment initialization failed: Missing client key");
          setLoading(false);
          return;
        }

        const triggerSnap = () => {
          if ((window as any).snap) {
            (window as any).snap.pay(data.token, {
              onSuccess: () => { 
                toast.success("Top-up successful!"); 
                onOpenChange(false); 
              },
              onPending: () => toast.info("Payment pending"),
              onError: () => toast.error("Payment failed"),
              onClose: () => toast.info("Payment cancelled"),
            });
          } else {
            toast.error("Payment system not ready. Please try again.");
          }
        };

        const existingScript = document.getElementById("midtrans-snap") as HTMLScriptElement;
        const currentKey = existingScript?.getAttribute("data-client-key");
        
        if (!existingScript || currentKey !== clientKey) {
          // Re-load if missing or key is different
          if (existingScript) existingScript.remove();
          
          const script = document.createElement("script");
          script.id = "midtrans-snap";
          script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute("data-client-key", clientKey);
          script.onload = () => {
            // Give it a tiny bit of time to initialize internal state
            setTimeout(triggerSnap, 100);
          };
          document.head.appendChild(script);
        } else {
          triggerSnap();
        }
      } else if (data.gateway === "xendit" && data.invoice_url) {
        window.open(data.invoice_url, "_blank");
        toast.info("Complete payment in the opened window");
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create top-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>
            Pilih atau masukkan jumlah saldo yang ingin Anda tambahkan ke dompet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount presets */}
          <div>
            <p className="text-sm font-medium mb-2">Select amount</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  variant={amount === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(a)}
                  className="text-xs"
                >
                  Rp {a.toLocaleString("id-ID")}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-sm font-medium mb-1">Or enter custom amount</p>
            <Input
              type="number"
              placeholder="Min. 10,000"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={10000}
              max={10000000}
            />
          </div>

          {/* Gateway selection */}
          {activeGateways.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-2">Payment method</p>
              <div className="flex gap-2">
                {activeGateways.map((g) => (
                  <Button
                    key={g.gateway}
                    variant={gateway === g.gateway ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGateway(g.gateway as Gateway)}
                    className="flex-1 capitalize"
                  >
                    {g.gateway}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleTopUp} disabled={loading || amount < 10000} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Top Up Rp {amount.toLocaleString("id-ID")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
