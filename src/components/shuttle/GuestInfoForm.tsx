import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GuestInfoFormProps {
  guestName: string;
  guestPhone: string;
  setGuestName: (name: string) => void;
  setGuestPhone: (phone: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GuestInfoForm({
  guestName,
  guestPhone,
  setGuestName,
  setGuestPhone,
  onNext,
  onBack
}: GuestInfoFormProps) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Info Penumpang</CardTitle>
          <p className="text-xs text-muted-foreground">Isi detail penumpang untuk tiket</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="gn">Nama Lengkap</Label>
            <Input id="gn" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Contoh: Budi Santoso" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gp">Nomor WhatsApp</Label>
            <Input id="gp" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="08123456789" className="h-11" />
            <p className="text-[10px] text-muted-foreground italic">* E-Tiket akan dikirimkan melalui WhatsApp</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onBack}>Kembali</Button>
            <Button className="flex-1 h-11 gradient-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" onClick={onNext}>Pilih Pembayaran</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
