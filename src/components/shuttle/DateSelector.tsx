import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedRoute: any;
  selectedDate: Date | undefined;
  availableDates: Date[];
  onSelectDate: (date: Date | undefined) => void;
  onBack: () => void;
}

export function DateSelector({ 
  selectedRoute, 
  selectedDate, 
  availableDates, 
  onSelectDate, 
  onBack 
}: DateSelectorProps) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pilih Tanggal</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedRoute?.name} • {selectedRoute?.origin} → {selectedRoute?.destination}
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            modifiers={{
              hasSchedule: availableDates,
            }}
            modifiersClassNames={{
              hasSchedule: "bg-primary/20 font-bold",
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={onBack}>Kembali</Button>
    </div>
  );
}
