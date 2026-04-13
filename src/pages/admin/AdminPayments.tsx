import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AdminPayments() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*, wallets(user_id, wallet_type)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pembayaran</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn: any) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(txn.created_at), "dd MMM yy HH:mm")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{txn.type.replace("_", " ")}</Badge></TableCell>
                      <TableCell className={txn.amount > 0 ? "text-green-600" : "text-red-600"}>
                        Rp {Math.abs(txn.amount).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.status === "completed" ? "default" : txn.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                          {txn.status === "completed" ? "Selesai" : txn.status === "failed" ? "Gagal" : "Diproses"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{txn.payment_gateway || "—"}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{txn.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!transactions.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Tidak ada transaksi</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
