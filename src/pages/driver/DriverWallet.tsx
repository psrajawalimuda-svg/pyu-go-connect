import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDriverStore } from "@/stores/driverStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TransactionList } from "@/components/wallet/TransactionList";
import { toast } from "sonner";
import {
  Wallet as WalletIcon, Filter, Building2, Plus, Send, Loader2, Trash2, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";

const BANKS = [
  "BCA", "BNI", "BRI", "Mandiri", "CIMB Niaga", "Danamon",
  "Permata", "BSI", "BTN", "OCBC NISP", "Maybank", "Panin",
  "Mega", "Bukopin", "Sinarmas", "Jago", "SeaBank", "Jenius",
];

export default function DriverWallet() {
  const { user } = useAuth();
  const { driverId } = useDriverStore();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: "", account_number: "", account_holder: "" });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");

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

  // Bank accounts
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["driver-bank-accounts", driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_bank_accounts")
        .select("*")
        .eq("driver_id", driverId!)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!driverId,
  });

  // Withdrawal requests
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["driver-withdrawals", driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, driver_bank_accounts(bank_name, account_number, account_holder)")
        .eq("driver_id", driverId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!driverId,
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

  // Realtime wallet updates
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

  // Add bank account
  const addBankMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("driver_bank_accounts").insert({
        driver_id: driverId!,
        bank_name: newBank.bank_name,
        account_number: newBank.account_number,
        account_holder: newBank.account_holder,
        is_default: bankAccounts.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rekening berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["driver-bank-accounts"] });
      setBankDialogOpen(false);
      setNewBank({ bank_name: "", account_number: "", account_holder: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete bank account
  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("driver_bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rekening dihapus");
      queryClient.invalidateQueries({ queryKey: ["driver-bank-accounts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Withdraw to bank
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("withdraw-to-bank", {
        body: {
          driver_id: driverId,
          bank_account_id: selectedBankId,
          amount: Number(withdrawAmount),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Penarikan Rp ${fmt(data.amount)} berhasil diajukan`);
      queryClient.invalidateQueries({ queryKey: ["driver-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["driver-wallet-txn"] });
      queryClient.invalidateQueries({ queryKey: ["driver-withdrawals"] });
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
  const balance = Number(wallet?.balance ?? 0);

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pending: { icon: <Clock className="w-3 h-3" />, label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
    processing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Diproses", color: "bg-blue-100 text-blue-800" },
    completed: { icon: <CheckCircle className="w-3 h-3" />, label: "Selesai", color: "bg-emerald-100 text-emerald-800" },
    failed: { icon: <XCircle className="w-3 h-3" />, label: "Gagal", color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Balance */}
      <Card className="bg-emerald-600 border-0 text-white">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Driver Wallet</span>
          </div>
          <p className="text-3xl font-bold">Rp {fmt(balance)}</p>

          {/* Withdraw button */}
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 gap-1.5"
                disabled={balance < 10000 || bankAccounts.length === 0}
              >
                <Send className="w-4 h-4" />
                Transfer ke Bank
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer ke Rekening Bank</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Rekening Tujuan</Label>
                  <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bank_name} - {b.account_number} ({b.account_holder})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jumlah (min. Rp 10.000)</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={10000}
                    max={balance}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Saldo tersedia: Rp {fmt(balance)}</p>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!selectedBankId || !withdrawAmount || Number(withdrawAmount) < 10000 || Number(withdrawAmount) > balance || withdrawMutation.isPending}
                  onClick={() => withdrawMutation.mutate()}
                >
                  {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajukan Penarikan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {bankAccounts.length === 0 && (
            <p className="text-xs opacity-60 mt-2">Tambah rekening bank terlebih dahulu</p>
          )}
        </CardContent>
      </Card>

      {/* Bank accounts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Rekening Bank
          </h2>
          <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Rekening Bank</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Bank</Label>
                  <Select value={newBank.bank_name} onValueChange={(v) => setNewBank((p) => ({ ...p, bank_name: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nomor Rekening</Label>
                  <Input
                    placeholder="1234567890"
                    value={newBank.account_number}
                    onChange={(e) => setNewBank((p) => ({ ...p, account_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Nama Pemilik Rekening</Label>
                  <Input
                    placeholder="Nama sesuai buku tabungan"
                    value={newBank.account_holder}
                    onChange={(e) => setNewBank((p) => ({ ...p, account_holder: e.target.value }))}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!newBank.bank_name || !newBank.account_number || !newBank.account_holder || addBankMutation.isPending}
                  onClick={() => addBankMutation.mutate()}
                >
                  {addBankMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              Belum ada rekening bank terdaftar
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bankAccounts.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.bank_name}</p>
                    <p className="text-xs text-muted-foreground">{b.account_number} • {b.account_holder}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteBankMutation.mutate(b.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Riwayat Penarikan
          </h2>
          <div className="space-y-2">
            {withdrawals.map((w: any) => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              return (
                <Card key={w.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Rp {fmt(Number(w.amount))}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {w.driver_bank_accounts?.bank_name} - {w.driver_bank_accounts?.account_number}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[9px] h-5 gap-1 ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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
