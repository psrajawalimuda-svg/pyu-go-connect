
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Add geography columns for spatial indexing
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS pickup_location geography(POINT, 4326),
ADD COLUMN IF NOT EXISTS dropoff_location geography(POINT, 4326);

-- Create function to update geography column from lat/lng
CREATE OR REPLACE FUNCTION public.update_geography_from_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'drivers' THEN
    IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
      NEW.location := ST_SetSRID(ST_MakePoint(NEW.current_lng, NEW.current_lat), 4326)::geography;
    ELSE
      NEW.location := NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'rides' THEN
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
      NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
    END IF;
    IF NEW.dropoff_lat IS NOT NULL AND NEW.dropoff_lng IS NOT NULL THEN
      NEW.dropoff_location := ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326)::geography;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-sync geography columns
CREATE TRIGGER trigger_update_driver_location
BEFORE INSERT OR UPDATE OF current_lat, current_lng ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.update_geography_from_coords();

CREATE TRIGGER trigger_update_ride_locations
BEFORE INSERT OR UPDATE OF pickup_lat, pickup_lng, dropoff_lat, dropoff_lng ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.update_geography_from_coords();

-- Add GIST indexes for spatial performance
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_location ON public.rides USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_rides_dropoff_location ON public.rides USING GIST (dropoff_location);

-- Update existing data
UPDATE public.drivers SET current_lat = current_lat WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
UPDATE public.rides SET pickup_lat = pickup_lat WHERE pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL;
