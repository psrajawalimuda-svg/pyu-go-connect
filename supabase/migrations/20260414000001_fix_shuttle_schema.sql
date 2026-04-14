-- Create shuttle_service_types table if it doesn't exist
-- (If table already exists with enum type, this is skipped)
CREATE TABLE IF NOT EXISTS public.shuttle_service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  baggage_info TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure active column exists (add if missing from earlier migration)
ALTER TABLE public.shuttle_service_types ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.shuttle_service_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Enable RLS for shuttle_service_types
ALTER TABLE public.shuttle_service_types ENABLE ROW LEVEL SECURITY;

-- Always ensure these policies exist (drop and recreate for consistency)
DROP POLICY IF EXISTS "Service types viewable by everyone" ON public.shuttle_service_types;
DROP POLICY IF EXISTS "Admins can manage service types" ON public.shuttle_service_types;

CREATE POLICY "Service types viewable by everyone" ON public.shuttle_service_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage service types" ON public.shuttle_service_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_shuttle_service_types_updated_at ON public.shuttle_service_types;
CREATE TRIGGER update_shuttle_service_types_updated_at BEFORE UPDATE ON public.shuttle_service_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add service_type_id and vehicle_type to shuttle_schedules (if not exists)
ALTER TABLE public.shuttle_schedules
  ADD COLUMN IF NOT EXISTS service_type_id UUID REFERENCES public.shuttle_service_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'standard';

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_service_type ON public.shuttle_schedules(service_type_id);
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_vehicle_type ON public.shuttle_schedules(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_shuttle_schedules_route_departure ON public.shuttle_schedules(route_id, departure_time);
