import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDriverStore } from "@/stores/driverStore";
import { toast } from "sonner";

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Play two-tone chime
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.15); // C#6
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.3); // E6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio not supported, silently ignore
  }
}

function showBrowserNotification(title: string, body: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/pyu_go_icon.png" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification(title, { body, icon: "/pyu_go_icon.png" });
      }
    });
  }
}

export function useIncomingRide() {
  const { driverId, isOnline, setCurrentRideId } = useDriverStore();
  const hasRequestedPermission = useRef(false);

  // Request notification permission when driver goes online
  useEffect(() => {
    if (isOnline && !hasRequestedPermission.current && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
      hasRequestedPermission.current = true;
    }
  }, [isOnline]);

  useEffect(() => {
    if (!driverId || !isOnline) return;

    const channel = supabase
      .channel(`driver-rides-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const ride = payload.new as any;
          if (ride.status === "accepted") {
            setCurrentRideId(ride.id);

            // Play sound
            playNotificationSound();

            // Browser notification
            showBrowserNotification(
              "🚗 Ride Baru!",
              `Pickup: ${ride.pickup_address || "Menuju lokasi pickup"}`
            );

            // In-app toast
            toast.info("🚗 Ride baru masuk!", {
              description: `Dari ${ride.pickup_address || "lokasi pickup"}`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, isOnline, setCurrentRideId]);
}
