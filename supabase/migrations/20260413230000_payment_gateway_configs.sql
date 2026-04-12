-- Migrasi untuk tabel payment_gateway_keys dan audit logs
-- Memungkinkan penyimpanan API Key terpisah untuk sandbox dan production dengan enkripsi

-- Aktifkan ekstensi pgcrypto jika belum ada (untuk enkripsi data di kolom jika diperlukan, 
-- namun untuk sekarang kita gunakan struktur JSONB yang aman dan RLS ketat)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabel untuk menyimpan detail API Key terpisah per environment
-- Kita gunakan kolom terenkripsi untuk server_key
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway TEXT NOT NULL, -- 'midtrans', 'xendit'
    environment TEXT NOT NULL, -- 'sandbox', 'production'
    client_key TEXT NOT NULL,
    server_key_encrypted TEXT NOT NULL, -- Simpan server key terenkripsi
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(gateway, environment)
);

-- 2. Tambahkan kolom ke payment_settings untuk menentukan environment yang aktif
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_settings' AND column_name='active_environment') THEN
        ALTER TABLE public.payment_settings ADD COLUMN active_environment TEXT DEFAULT 'sandbox';
    END IF;
END $$;

-- 3. Tabel Audit Log untuk mencatat perubahan API Key
CREATE TABLE IF NOT EXISTS public.payment_config_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway TEXT NOT NULL,
    environment TEXT NOT NULL,
    action TEXT NOT NULL, -- 'update', 'toggle_active', 'toggle_environment'
    changed_by UUID REFERENCES auth.users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS (Row Level Security)
ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config_audit_logs ENABLE ROW LEVEL SECURITY;

-- Hanya Admin yang bisa melihat dan mengelola config
CREATE POLICY "Admins can manage gateway configs" ON public.payment_gateway_configs
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view audit logs" ON public.payment_config_audit_logs
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Fungsi untuk enkripsi (Simple helper, idealnya menggunakan Vault di Supabase jika tersedia)
-- Namun kita akan mengimplementasikan enkripsi di sisi Edge Function untuk keamanan lebih baik
-- agar server key tidak pernah menyentuh database dalam bentuk plain text.

-- 6. Trigger updated_at
CREATE TRIGGER update_payment_gateway_configs_updated_at 
    BEFORE UPDATE ON public.payment_gateway_configs 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
