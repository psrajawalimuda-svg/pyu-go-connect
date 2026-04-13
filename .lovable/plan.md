

# Pengembangan Modul Driver: Kendaraan & Profil

## Ringkasan
Memperbaiki dan menyempurnakan modul Driver Profile dan Vehicle Management agar lebih robust, user-friendly, dan production-ready.

---

## Masalah yang Ditemukan

1. **Driver registration metadata key mismatch** — `DriverAuth.tsx` mengirim `isDriver: true` tapi trigger `handle_new_user` membaca `is_driver`. Registrasi driver tidak pernah membuat record di tabel `drivers`.
2. **Profil tidak menampilkan email** — Field `email` tidak ada di tabel `drivers`, jadi selalu "Email tidak tersedia".
3. **PIN disimpan plain text** — `SecuritySettings.tsx` menyimpan PIN tanpa hashing.
4. **Tidak ada validasi file type** saat upload dokumen (KTP/SIM/STNK) — hanya `accept="image/*"` tanpa server-side check.
5. **Vehicle form tidak ada validasi plate format** — Nomor polisi bisa diisi sembarang.
6. **Tidak ada konfirmasi hapus kendaraan yang proper** — Menggunakan `window.confirm()` bukan Dialog component.
7. **Driver `email` field missing** — Perlu ditambahkan ke tabel `drivers` atau diambil dari auth user.

---

## Rencana Perubahan

### 1. Fix Registration Metadata Key
**File:** `src/pages/driver/DriverAuth.tsx`
- Ubah `isDriver: true` → `is_driver: true` agar cocok dengan trigger `handle_new_user`.

### 2. Tambah Kolom `email` ke Tabel `drivers`
**Migration:**
- Tambah kolom `email TEXT` ke tabel `drivers`.
- Update trigger `handle_new_user` untuk mengisi `email` dari `NEW.email`.
- Update trigger `handle_user_update` untuk sync email.

### 3. Perbaiki ProfilePhoto — Handle Missing Storage Bucket
**File:** `src/components/driver/profile/ProfilePhoto.tsx`
- Tidak ada perubahan major, sudah cukup baik.

### 4. Perbaiki BasicInfoForm — Ambil Email dari Auth
**File:** `src/components/driver/profile/BasicInfoForm.tsx`
- Tampilkan email dari driver record (setelah kolom ditambah).

### 5. Perbaiki VehicleInfo — Better UX
**File:** `src/components/driver/profile/VehicleInfo.tsx`
- Ganti `window.confirm()` dengan AlertDialog component.
- Tambah validasi format nomor polisi.
- Tambah validasi tahun kendaraan (min 1990, max tahun sekarang + 1).

### 6. Perbaiki SecuritySettings — Hash PIN
**File:** `src/components/driver/profile/SecuritySettings.tsx`
- Gunakan simple hash (SHA-256 via Web Crypto API) sebelum menyimpan PIN.
- Verifikasi PIN lama sebelum update.

### 7. Perbaiki DocumentVerification — File Size Validation
**File:** `src/components/driver/profile/DocumentVerification.tsx`
- Tambah validasi ukuran file (max 5MB).
- Tambah validasi tipe file (hanya image/jpeg, image/png).

---

## Detail Teknis

### Migration SQL
```sql
-- Add email column to drivers
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS email TEXT;

-- Update handle_new_user to populate email
CREATE OR REPLACE FUNCTION public.handle_new_user() ...
  -- Add: email = NEW.email in INSERT INTO drivers
```

### Files yang Diubah
| File | Perubahan |
|------|-----------|
| `src/pages/driver/DriverAuth.tsx` | Fix `isDriver` → `is_driver` key |
| `src/components/driver/profile/VehicleInfo.tsx` | AlertDialog, validasi plate & year |
| `src/components/driver/profile/SecuritySettings.tsx` | PIN hashing via Web Crypto |
| `src/components/driver/profile/DocumentVerification.tsx` | File size & type validation |
| `src/components/driver/profile/BasicInfoForm.tsx` | Minor: email dari driver record |
| 1 migration | Add `email` column + update triggers |

