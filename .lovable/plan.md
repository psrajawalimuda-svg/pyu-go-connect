

# Admin Settings Page

## Overview
Add a new `/admin/settings` page with tabs for configuring app-wide settings: ride fares, service zones, and payment gateways. Move payment gateway config from the existing Payments page into this centralized settings page.

## Changes

### 1. Create `app_settings` table (migration)
A key-value config table for app-wide settings:
```sql
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- Admin full access
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
-- Public read for app config
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
```

Seed initial settings:
- `ride_fares` — base fare, per-km rate, minimum fare per service type (car/bike)
- `service_zones` — list of active zone names with coordinates/radius

### 2. Create `AdminSettings.tsx` page
Three tabs using the existing Tabs component:

**Tab 1: Ride Fares**
- Editable fields for each service type: base fare (Rp), per-km rate (Rp), minimum fare (Rp), surge multiplier
- Save button per section

**Tab 2: Service Zones**
- List of zones with name, center coordinates, radius
- Add/edit/delete zones
- Simple form (no map needed initially)

**Tab 3: Payment Gateways**
- Move the gateway cards (toggle active, set default, commission) from `AdminPayments.tsx` into this tab
- `AdminPayments.tsx` keeps only the transactions table

### 3. Update routing
- Add `Settings` nav item with `Settings` icon to `AdminLayout.tsx`
- Add route `/admin/settings` → `AdminSettings` in `App.tsx`

### 4. Refactor `AdminPayments.tsx`
- Remove the gateway cards section (moved to Settings)
- Keep only the "Recent Transactions" table

## Implementation Order
1. Database migration for `app_settings` table + seed data
2. Create `AdminSettings.tsx` with 3 tabs
3. Update `AdminLayout.tsx` nav + `App.tsx` routes
4. Simplify `AdminPayments.tsx`

