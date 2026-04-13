import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { AdminPagination } from "@/components/admin/AdminPagination";

type WithdrawalStatus = "pending" | "processing" | "completed" | "failed";

const ITEMS_PER_PAGE = 20;

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [actionDialog, setActionDialog] = useState<{ open: boolean; withdrawal: any; action: "approve" | "reject" } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals", statusFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let q = supabase
        .from("withdrawal_requests")
        .select("*, drivers(full_name, phone, user_id), driver_bank_accounts(bank_name, account_number, account_holder)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { withdrawals: data ?? [], totalCount: count || 0 };
    },
  });

  const withdrawals = data?.withdrawals || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / ITEMS_PER_PAGE);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status,
          admin_notes: notes || null,
          processed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "completed" ? "Penarikan disetujui" : "Penarikan ditolak");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setActionDialog(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = withdrawals.filter((w: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.drivers?.full_name?.toLowerCase().includes(s) ||
      w.driver_bank_accounts?.bank_name?.toLowerCase().includes(s) ||
      w.driver_bank_accounts?.account_number?.includes(s)
    );
  });

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { icon: <Clock className="w-3 h-3" />, label: "Menunggu", variant: "secondary" },
    processing: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Diproses", variant: "outline" },
    completed: { icon: <CheckCircle className="w-3 h-3" />, label: "Selesai", variant: "default" },
    failed: { icon: <XCircle className="w-3 h-3" />, label: "Ditolak", variant: "destructive" },
  };

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin-withdrawal-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("status, amount");
      if (error) throw error;
      const pending = data?.filter(d => d.status === "pending") ?? [];
      const completed = data?.filter(d => d.status === "completed") ?? [];
      return {
        pendingCount: pending.length,
        pendingAmount: pending.reduce((s, d) => s + Number(d.amount), 0),
        completedCount: completed.length,
        completedAmount: completed.reduce((s, d) => s + Number(d.amount), 0),
        totalCount: data?.length ?? 0,
      };
    },
  });

  // Filters
  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  if (isLoading) return <ListPageSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Permintaan Penarikan Saldo</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stats?.pendingCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Menunggu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-amber-600">Rp {fmt(stats?.pendingAmount ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Total Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{stats?.completedCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-emerald-600">Rp {fmt(stats?.completedAmount ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Total Dicairkan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={statusFilter} onValueChange={handleStatusFilterChange} className="flex-1">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Diproses</TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
            <TabsTrigger value="failed">Ditolak</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari driver / bank..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Rekening Tujuan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w: any) => {
                  const cfg = statusConfig[w.status as WithdrawalStatus] || statusConfig.pending;
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(w.created_at), "dd MMM yy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{w.drivers?.full_name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{w.drivers?.phone ?? ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{w.driver_bank_accounts?.bank_name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {w.driver_bank_accounts?.account_number} • {w.driver_bank_accounts?.account_holder}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        Rp {fmt(Number(w.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1 text-[10px]">
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {w.admin_notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {w.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => setActionDialog({ open: true, withdrawal: w, action: "approve" })}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => setActionDialog({ open: true, withdrawal: w, action: "reject" })}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                        {w.processed_at && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(w.processed_at), "dd MMM yy HH:mm")}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Tidak ada permintaan penarikan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <AdminPagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog?.open} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Konfirmasi Persetujuan" : "Konfirmasi Penolakan"}
            </DialogTitle>
          </DialogHeader>
          {actionDialog?.withdrawal && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Driver:</span> {actionDialog.withdrawal.drivers?.full_name}</p>
                <p><span className="text-muted-foreground">Jumlah:</span> <span className="font-bold">Rp {fmt(Number(actionDialog.withdrawal.amount))}</span></p>
                <p><span className="text-muted-foreground">Bank:</span> {actionDialog.withdrawal.driver_bank_accounts?.bank_name} - {actionDialog.withdrawal.driver_bank_accounts?.account_number}</p>
                <p><span className="text-muted-foreground">Pemilik:</span> {actionDialog.withdrawal.driver_bank_accounts?.account_holder}</p>
              </div>

              <p className="text-sm text-muted-foreground">
                {actionDialog.action === "approve" 
                  ? "Apakah Anda yakin ingin menyetujui permintaan penarikan ini?" 
                  : "Apakah Anda yakin ingin menolak permintaan penarikan ini?"}
              </p>

              <div>
                <Label>Catatan Admin (Opsional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionDialog.action === "reject" ? "Masukkan alasan penolakan..." : "Masukkan catatan atau bukti transfer..."}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setActionDialog(null)}>
                  Batal
                </Button>
                <Button
                  className={`flex-1 ${actionDialog.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                  variant={actionDialog.action === "reject" ? "destructive" : "default"}
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: actionDialog.withdrawal.id,
                      status: actionDialog.action === "approve" ? "completed" : "failed",
                      notes: adminNotes,
                    })
                  }
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : actionDialog.action === "approve" ? (
                    "Ya, Setujui"
                  ) : (
                    "Ya, Tolak"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
