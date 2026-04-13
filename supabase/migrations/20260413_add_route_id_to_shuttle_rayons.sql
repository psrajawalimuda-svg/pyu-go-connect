-- Add route_id FK to shuttle_rayons to properly filter pickup zones by route
-- Use IF NOT EXISTS to make migration idempotent
ALTER TABLE public.shuttle_rayons
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.shuttle_routes(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate rayon names per route
-- Drop if exists first to avoid conflicts
ALTER TABLE public.shuttle_rayons DROP CONSTRAINT IF EXISTS unique_rayon_per_route;
ALTER TABLE public.shuttle_rayons
ADD CONSTRAINT unique_rayon_per_route UNIQUE(route_id, name);

-- Create index for faster filtering (drop existing first)
DROP INDEX IF EXISTS idx_shuttle_rayons_route_id;
CREATE INDEX idx_shuttle_rayons_route_id ON public.shuttle_rayons(route_id);
