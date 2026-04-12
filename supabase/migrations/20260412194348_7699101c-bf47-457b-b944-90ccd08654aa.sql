
-- Driver bank accounts
CREATE TABLE public.driver_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own bank accounts"
  ON public.driver_bank_accounts FOR SELECT USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Drivers can insert own bank accounts"
  ON public.driver_bank_accounts FOR INSERT WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Drivers can update own bank accounts"
  ON public.driver_bank_accounts FOR UPDATE USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Drivers can delete own bank accounts"
  ON public.driver_bank_accounts FOR DELETE USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage bank accounts"
  ON public.driver_bank_accounts FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.driver_bank_accounts(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own withdrawals"
  ON public.withdrawal_requests FOR SELECT USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Drivers can create withdrawals"
  ON public.withdrawal_requests FOR INSERT WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage withdrawals"
  ON public.withdrawal_requests FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Triggers for updated_at
CREATE TRIGGER update_driver_bank_accounts_updated_at
  BEFORE UPDATE ON public.driver_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
