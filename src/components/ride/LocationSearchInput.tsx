import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchInputProps {
  placeholder: string;
  value: string;
  onSelect: (lat: number, lng: number, address: string) => void;
  onClear?: () => void;
  dotColor: string;
}

export function LocationSearchInput({
  placeholder,
  value,
  onSelect,
  onClear,
  dotColor,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (from map tap)
  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=id&limit=5&addressdetails=1`
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleChange = (val: string) => {
    setQuery(val);
    search(val);
  };

  const handleSelect = (r: NominatimResult) => {
    const address = r.display_name.split(",").slice(0, 3).join(",");
    setQuery(address);
    setOpen(false);
    onSelect(parseFloat(r.lat), parseFloat(r.lon), address);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 w-full">
      <div className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="h-8 text-xs bg-transparent border-none shadow-none px-0 focus-visible:ring-0"
        />
        {loading && (
          <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
        )}
        {query && onClear && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              onClear();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
            >
              {r.display_name.split(",").slice(0, 4).join(",")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
