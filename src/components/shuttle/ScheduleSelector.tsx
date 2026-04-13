import { Clock, ArrowRight, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ScheduleSelectorProps {
  filteredSchedules: any[];
  selectedRoute: any;
  selectedDate: Date | undefined;
  onSelectSchedule: (schedule: any) => void;
  onBack: () => void;
}

export function ScheduleSelector({
  filteredSchedules,
  selectedRoute,
  selectedDate,
  onSelectSchedule,
  onBack
}: ScheduleSelectorProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Jadwal</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.name} • {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: localeId })}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredSchedules.length === 0 && <p className="text-xs text-muted-foreground py-2">Tidak ada jadwal untuk tanggal ini</p>}
          {filteredSchedules.map((s: any) => (
            <button key={s.id} disabled={s.available_seats === 0} onClick={() => onSelectSchedule(s)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{format(new Date(s.departure_time), "HH:mm")}</span>
                {s.arrival_time && (<><ArrowRight className="w-3 h-3 text-muted-foreground" /><span className="text-sm text-muted-foreground">{format(new Date(s.arrival_time), "HH:mm")}</span></>)}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs flex items-center gap-1 text-muted-foreground"><Users className="w-3 h-3" />{s.available_seats} kursi</span>
                <span className="font-bold text-sm text-primary">Rp {(selectedRoute?.base_fare ?? 0).toLocaleString("id-ID")}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={onBack}>Kembali</Button>
    </div>
  );
}
