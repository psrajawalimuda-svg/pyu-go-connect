-- Add UNIQUE constraint to booking_ref in shuttle_bookings
-- Drop constraint first if it exists
ALTER TABLE public.shuttle_bookings 
DROP CONSTRAINT IF EXISTS unique_booking_ref;

ALTER TABLE public.shuttle_bookings 
ADD CONSTRAINT unique_booking_ref UNIQUE(booking_ref);

-- Create indexes for fast lookups (drop existing first)
DROP INDEX IF EXISTS idx_shuttle_bookings_booking_ref;
CREATE INDEX idx_shuttle_bookings_booking_ref ON public.shuttle_bookings(booking_ref);

DROP INDEX IF EXISTS idx_shuttle_bookings_user_id;
CREATE INDEX idx_shuttle_bookings_user_id ON public.shuttle_bookings(user_id)
  WHERE user_id IS NOT NULL;

-- Create or update function to sync available_seats with actual seat count
CREATE OR REPLACE FUNCTION public.sync_available_seats_on_schedule(p_schedule_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.shuttle_schedules
  SET available_seats = (
    SELECT COUNT(*) FROM public.shuttle_seats 
    WHERE schedule_id = p_schedule_id 
      AND status = 'available'
  )
  WHERE id = p_schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create or update trigger function
CREATE OR REPLACE FUNCTION public.trigger_sync_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_available_seats_on_schedule(
    COALESCE(NEW.schedule_id, OLD.schedule_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_seats_on_shuttle_seats_change ON public.shuttle_seats;

-- Create trigger on INSERT, UPDATE, and DELETE on shuttle_seats
CREATE TRIGGER sync_seats_on_shuttle_seats_change
AFTER INSERT OR UPDATE OR DELETE ON public.shuttle_seats
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sync_available_seats();

-- Populate existing shuttle_schedules with correct available_seats count
UPDATE public.shuttle_schedules
SET available_seats = (
  SELECT COUNT(*) FROM public.shuttle_seats 
  WHERE schedule_id = shuttle_schedules.id 
    AND status = 'available'
) WHERE id IS NOT NULL;
