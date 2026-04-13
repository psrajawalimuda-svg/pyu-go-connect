import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Timer for 5 seconds total (as requested)
    // 4.5 seconds of solid display, 0.5s fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);

    const finishTimer = setTimeout(() => {
      setShouldRender(false);
      onFinish();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-1000">
        <img
          src="/pyu_go_icon.png"
          alt="PYU GO Logo"
          className="w-32 h-32 md:w-48 md:h-48 object-contain mb-4 drop-shadow-xl"
        />
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-[#1a9e5c]">
            PYU <span className="text-[#0f172a]">GO</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium mt-2">
            One App, All Your Ways.
          </p>
        </div>
      </div>
      
      {/* Optional: Loading indicator at bottom */}
      <div className="absolute bottom-12 flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-[#1a9e5c] animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-[#1a9e5c] animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-[#1a9e5c] animate-bounce"></div>
      </div>
    </div>
  );
}
