import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Key, ShieldCheck, Globe } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// ... (semua type FareConfig, ZoneConfig, useSetting, useSaveSetting tetap sama)

// ─── Midtrans API Keys Tab ─────────────────────
function MidtransKeysTab() {
  const qc = useQueryClient();
  const [activeEnv, setActiveEnv] = useState<"sandbox" | "production">("sandbox");

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin-gateway-configs", "midtrans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "midtrans");
      return data || [];
    },
  });

  const { data: setting } = useQuery({
    queryKey: ["admin-payment-settings", "midtrans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("gateway", "midtrans")
        .single();
      return data;
    },
  });

  useEffect(() => {
    if (setting?.active_environment) {
      setActiveEnv(setting.active_environment as "sandbox" | "production");
    }
  }, [setting]);

  const saveConfig = useMutation({
    mutationFn: async (payload: { environment: string; client_key: string; server_key: string }) => {
      // Kita memanggil edge function 'manage-gateway-keys' untuk enkripsi server key
      const { error } = await supabase.functions.invoke("manage-gateway-keys", {
        body: { 
          action: "update",
          gateway: "midtrans",
          ...payload 
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gateway-configs", "midtrans"] });
      toast.success("API Keys updated and encrypted successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleEnv = useMutation({
    mutationFn: async (env: string) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({ active_environment: env })
        .eq("gateway", "midtrans");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payment-settings", "midtrans"] });
      toast.success(`Environment switched to ${activeEnv}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin mx-auto mt-8" />;

  const sandboxConfig = configs.find(c => c.environment === "sandbox") || { client_key: "" };
  const productionConfig = configs.find(c => c.environment === "production") || { client_key: "" };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Active Environment
              </CardTitle>
              <CardDescription>Pilih environment yang akan digunakan untuk transaksi real-time.</CardDescription>
            </div>
            <div className="flex items-center gap-4 bg-background p-2 rounded-lg border">
              <div className="flex items-center space-x-2">
                <RadioGroup 
                  value={activeEnv} 
                  onValueChange={(v) => {
                    const newEnv = v as "sandbox" | "production";
                    setActiveEnv(newEnv);
                    toggleEnv.mutate(newEnv);
                  }}
                  className="flex"
                >
                  <div className="flex items-center space-x-2 mr-4">
                    <RadioGroupItem value="sandbox" id="sandbox" />
                    <Label htmlFor="sandbox">Sandbox</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="production" id="production" />
                    <Label htmlFor="production">Production</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sandbox Config */}
        <ConfigForm 
          title="Sandbox Keys" 
          description="Gunakan key dari dashboard Midtrans Sandbox."
          env="sandbox"
          initialClientKey={sandboxConfig.client_key}
          onSave={(data) => saveConfig.mutate({ ...data, environment: "sandbox" })}
          isPending={saveConfig.isPending}
        />

        {/* Production Config */}
        <ConfigForm 
          title="Production Keys" 
          description="Gunakan key dari dashboard Midtrans Production (Sangat Rahasia)."
          env="production"
          initialClientKey={productionConfig.client_key}
          onSave={(data) => saveConfig.mutate({ ...data, environment: "production" })}
          isPending={saveConfig.isPending}
        />
      </div>
    </div>
  );
}

function ConfigForm({ title, description, env, initialClientKey, onSave, isPending }: any) {
  const [clientKey, setClientKey] = useState(initialClientKey || "");
  const [serverKey, setServerKey] = useState("");

  useEffect(() => {
    setClientKey(initialClientKey || "");
  }, [initialClientKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientKey.startsWith("SB-Mid-client-") && env === "sandbox") {
      toast.error("Format Client Key Sandbox tidak valid");
      return;
    }
    if (!clientKey.startsWith("Mid-client-") && env === "production") {
      toast.error("Format Client Key Production tidak valid");
      return;
    }
    onSave({ client_key: clientKey, server_key: serverKey });
    setServerKey(""); // Reset server key field after save for security
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="w-4 h-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Client Key</Label>
            <Input 
              value={clientKey} 
              onChange={(e) => setClientKey(e.target.value)} 
              placeholder={env === "sandbox" ? "SB-Mid-client-..." : "Mid-client-..."}
              className="text-xs"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Server Key</Label>
            <Input 
              type="password"
              value={serverKey} 
              onChange={(e) => setServerKey(e.target.value)} 
              placeholder={env === "sandbox" ? "SB-Mid-server-..." : "Mid-server-..."}
              className="text-xs"
              required={!initialClientKey} // Required only if setting up for the first time
            />
            {initialClientKey && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                Server Key sudah tersimpan secara terenkripsi. Isi untuk memperbarui.
              </p>
            )}
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save {env} Keys
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ... (RideFaresTab, ServiceZonesTab, PaymentGatewaysTab tetap sama)

// ─── Main Settings Page ────────────────────────
export default function AdminSettings() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">App Settings</h1>
      <Tabs defaultValue="fares">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="fares">Ride Fares</TabsTrigger>
          <TabsTrigger value="zones">Service Zones</TabsTrigger>
          <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
          <TabsTrigger value="midtrans">Midtrans API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="fares"><RideFaresTab /></TabsContent>
        <TabsContent value="zones"><ServiceZonesTab /></TabsContent>
        <TabsContent value="gateways"><PaymentGatewaysTab /></TabsContent>
        <TabsContent value="midtrans"><MidtransKeysTab /></TabsContent>
      </Tabs>
    </div>
  );
}
