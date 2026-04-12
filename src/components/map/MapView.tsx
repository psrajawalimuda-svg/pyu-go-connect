import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const driverIcon = new L.DivIcon({
  html: `<div style="background: hsl(142, 76%, 36%); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 5H6.3a2 2 0 0 0-1.6.8L2 9.5 1.5 11c-.8.2-1.5 1-1.5 1.9V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
  </div>`,
  className: "", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
});

export interface DriverMarker {
  id: string; name: string; lat: number; lng: number;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick?.(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function AutoFitBounds({ pickup, dropoff }: {
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]);
      map.flyToBounds(bounds.pad(0.3), { duration: 0.8, maxZoom: 16 });
    } else if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 15, { duration: 0.6 });
    } else if (dropoff) {
      map.flyTo([dropoff.lat, dropoff.lng], 15, { duration: 0.6 });
    }
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, map]);
  return null;
}

// Fetch OSRM route and render polyline
function RouteLine({ pickup, dropoff, onRouteInfo }: {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  onRouteInfo?: (distanceKm: number, durationMin: number) => void;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (cancelled || !data.routes?.[0]) return;
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );
        setRouteCoords(coords);
        if (onRouteInfo) {
          const distKm = data.routes[0].distance / 1000;
          const durMin = data.routes[0].duration / 60;
          onRouteInfo(distKm, durMin);
        }
      } catch {
        // Fallback: straight line
        setRouteCoords([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]);
      }
    };
    fetchRoute();
    return () => { cancelled = true; };
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, onRouteInfo]);

  if (routeCoords.length === 0) return null;
  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{ color: "hsl(217, 91%, 60%)", weight: 5, opacity: 0.8, dashArray: undefined }}
    />
  );
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  drivers?: DriverMarker[];
  onMapClick?: (lat: number, lng: number) => void;
  onRouteInfo?: (distanceKm: number, durationMin: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MapView({
  center = [-6.2088, 106.8456],
  zoom = 14,
  pickup, dropoff,
  drivers = [],
  onMapClick,
  onRouteInfo,
  className = "w-full h-full",
  children,
}: MapViewProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      <AutoFitBounds pickup={pickup} dropoff={dropoff} />
      {pickup && dropoff && (
        <RouteLine pickup={pickup} dropoff={dropoff} onRouteInfo={onRouteInfo} />
      )}
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>Pick-up location</Popup>
        </Marker>
      )}
      {dropoff && (
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
          <Popup>Drop-off location</Popup>
        </Marker>
      )}
      {drivers.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
          <Popup>{d.name}</Popup>
        </Marker>
      ))}
      {children}
    </MapContainer>
  );
}
