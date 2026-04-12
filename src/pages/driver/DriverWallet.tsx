import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionList } from "@/components/wallet/TransactionList";
import { Wallet as WalletIcon, Filter } from "lucide-react";

export default function DriverWallet() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");

  // Driver wallet
  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["driver-wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .eq("wallet_type", "driver")
        .maybeSingle();
      if (!data) {
        const { data: nw } = await supabase
          .from("wallets")
          .insert({ user_id: user!.id, wallet_type: "driver" as const })
          .select("*")
          .single();
        return nw;
      }
      return data;
    },
    enabled: !!user,
  });

  // Transactions
  const { data: transactions = [], isLoading: txnLoading } = useQuery({
    queryKey: ["driver-wallet-txn", wallet?.id, filterType],
    queryFn: async () => {
      if (!wallet) return [];
      let q = supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (filterType !== "all") q = q.eq("type", filterType as any);
      const { data } = await q;
      return data || [];
    },
    enabled: !!wallet,
  });

  // Realtime
  useEffect(() => {
    if (!wallet) return;
    const channel = supabase
      .channel("driver-wallet-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "wallets", filter: `id=eq.${wallet.id}` }, () => {
        refetchWallet();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [wallet?.id, refetchWallet]);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Balance */}
      <Card className="bg-emerald-600 border-0 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Driver Wallet</span>
          </div>
          <p className="text-3xl font-bold">
            Rp {(wallet?.balance || 0).toLocaleString("id-ID")}
          </p>
          <p className="text-xs opacity-60 mt-1">
            Saldo dari withdraw pendapatan ride
          </p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Riwayat Transaksi</h2>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="ride_earning">Pendapatan</SelectItem>
              <SelectItem value="withdrawal">Penarikan</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TransactionList transactions={transactions as any} isLoading={txnLoading} />
      </div>
    </div>
  );
}
