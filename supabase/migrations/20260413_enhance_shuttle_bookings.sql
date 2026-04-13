-- Add email field to shuttle_bookings for booking confirmation
ALTER TABLE public.shuttle_bookings
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add guest_email index for quick lookups if needed
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_email ON public.shuttle_bookings(email)
  WHERE email IS NOT NULL;

-- Add passenger count for validation
ALTER TABLE public.shuttle_bookings
ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1;

-- Rename ambiguous status column to booking_status for clarity
-- (if payment_status was already added, this helps distinguish)
ALTER TABLE public.shuttle_bookings
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'confirmed'
  CHECK (booking_status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Add notes field for special requests
ALTER TABLE public.shuttle_bookings
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Create index for datetime searching
CREATE INDEX IF NOT EXISTS idx_shuttle_bookings_created_at ON public.shuttle_bookings(created_at DESC);

-- Update RLS policies to include email in guest info
DROP POLICY IF EXISTS "Anyone can create shuttle bookings" ON public.shuttle_bookings;
CREATE POLICY "Anyone can create shuttle bookings" ON public.shuttle_bookings FOR INSERT 
  WITH CHECK (
    -- Allow if: user owns it OR valid guest booking with contact info
    auth.uid() = user_id OR 
    (user_id IS NULL AND (email IS NOT NULL OR guest_phone IS NOT NULL))
  );
