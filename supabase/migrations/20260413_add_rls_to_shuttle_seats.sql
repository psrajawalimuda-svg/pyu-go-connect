-- Add Row-Level Security to shuttle_seats table
-- Check if RLS is already enabled
DO $$
BEGIN
  -- Only enable RLS if not already enabled
  ALTER TABLE public.shuttle_seats ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Already enabled, continue
END
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Seats viewable by everyone" ON public.shuttle_seats;
DROP POLICY IF EXISTS "Reserved seats immutable by users" ON public.shuttle_seats;
DROP POLICY IF EXISTS "Admins can manage seats" ON public.shuttle_seats;

-- Everyone can view available seat information
CREATE POLICY "Seats viewable by everyone" ON public.shuttle_seats FOR SELECT USING (true);

-- Only system (via RPC) can update seats during reservation
-- This prevents direct client manipulation
CREATE POLICY "Reserved seats immutable by users" ON public.shuttle_seats FOR UPDATE 
  USING (false)  -- Users cannot directly update
  WITH CHECK (false);

-- Admin can manage all seats
CREATE POLICY "Admins can manage seats" ON public.shuttle_seats FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster seat lookups (drop if exists first)
DROP INDEX IF EXISTS idx_shuttle_seats_schedule_status;
CREATE INDEX idx_shuttle_seats_schedule_status ON public.shuttle_seats(schedule_id, status);
