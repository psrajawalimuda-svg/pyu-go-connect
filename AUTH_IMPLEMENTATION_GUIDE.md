# Auth Routes - Implementation Guide & Code Fixes

**Status**: Ready for Implementation  
**Priority**: 3 Levels - HIGH, MEDIUM, LOW  
**Effort**: Estimated 4-6 hours for complete implementation

---

## 🔴 PRIORITY 1: Critical Fixes (HIGH)

### Fix 1.1: Remove Broken Admin Redirect from Auth.tsx

**File**: `src/pages/Auth.tsx`  
**Problem**: Race condition on login - tries to check role before auth state updates  
**Solution**: Remove manual redirect, let useAuth handle it

#### Current Code (BROKEN):
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success("Selamat datang kembali!");
      
      // ❌ THIS IS BROKEN - Race condition
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        navigate("/admin");  // ❌ This redirect never happens
      } else {
        navigate("/");       // ❌ Users may be redirected before auth state updates
      }
    }
    // ... rest of code
  }
};
```

#### FIXED Code:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success("Selamat datang kembali!");
      // ✅ REMOVED manual redirect - useAuth hook handles it
      // ✅ App routing will auto-redirect based on role
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      toast.success("Silakan cek email Anda untuk konfirmasi akun!");
    }
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Why This Works**:
- useAuth hook automatically fetches role after signIn
- Role updates trigger authStore update
- App routing watches authStore for changes
- ProtectedRoute enforces correct path

---

### Fix 1.2: Add Phone & License Validation to DriverAuth

**File**: `src/pages/driver/DriverAuth.tsx`  
**Problem**: No format validation for phone and license number  
**Solution**: Add client-side validation helper function

#### Add Validation Helpers:
```typescript
// Add to top of DriverAuth.tsx
const validatePhone = (phone: string): string | null => {
  // Indonesia phone format: +62XXXXXXXXXX or 08XXXXXXXXXX
  const phoneRegex = /^(\+62|62|0)[0-9]{9,11}$/;
  if (!phone) return "Nomor telepon diperlukan";
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    return "Format: +6281234567 atau 0812345678";
  }
  return null;
};

const validateLicense = (license: string): string | null => {
  // Indonesia SIM format: 8-12 digits
  const licenseRegex = /^\d{8,12}$/;
  if (!license) return "Nomor SIM diperlukan";
  if (!licenseRegex.test(license)) {
    return "Nomor SIM harus 8-12 digit (contoh: 12345678)";
  }
  return null;
};

const validateDriverForm = (): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!fullName.trim()) errors.fullName = "Nama lengkap diperlukan";
  if (!email.includes("@")) errors.email = "Email tidak valid";
  if (password.length < 6) errors.password = "Password minimal 6 karakter";
  
  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;
  
  const licenseError = validateLicense(licenseNumber);
  if (licenseError) errors.license = licenseError;
  
  return errors;
};
```

#### Update Form Submission:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // ✅ Add validation
  if (!isLogin) {
    const errors = validateDriverForm();
    if (Object.keys(errors).length > 0) {
      toast.error("Mohon perbaiki error di formulir");
      // Optionally show first error
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }
  }
  
  setLoading(true);
  try {
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success("Selamat datang kembali, Kapten!");
      navigate("/driver");
    } else {
      const { error } = await signUp(email, password, fullName, {
        phone,
        license_number: licenseNumber,
        isDriver: true,
      });
      if (error) throw error;
      toast.success("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.");
      setIsLogin(true);
    }
  } catch (err: any) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Add Error Display to Inputs:
```typescript
const [formErrors, setFormErrors] = useState<Record<string, string>>({});

// In form...
<div className="space-y-1.5">
  <Label htmlFor="phone" className="text-slate-700 font-semibold ml-1">
    Nomor Telepon
  </Label>
  <Input 
    id="phone" 
    type="tel"
    value={phone} 
    onChange={(e) => setPhone(e.target.value)} 
    placeholder="0812xxxx" 
    className={`rounded-xl border-slate-200 focus:ring-emerald-500 ${
      formErrors.phone ? "border-red-500" : ""
    }`}
    required 
  />
  {formErrors.phone && (
    <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
  )}
</div>
```

---

## 🟠 PRIORITY 2: Major Improvements (MEDIUM)

### Fix 2.1: Implement Post-Login Redirect

**Problem**: User loses context when redirected to login  
**Example**: User tries to access `/driver/profile` → redirected to `/driver/auth` → redirected to `/driver` instead of back to `/driver/profile`

**Solution**: Use location state to track original destination

#### Step 1: Update Auth.tsx to Handle Redirect

```typescript
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  // ... existing code ...
  const location = useLocation();
  const { user, role, isLoading } = useAuth();
  
  // ✅ Add effect to redirect after successful login
  useEffect(() => {
    if (user && role && !isLoading) {
      const from = location.state?.from?.pathname;
      
      // Redirect back to original page if available
      if (from && from !== "/auth" && from !== "/driver/auth") {
        navigate(from, { replace: true });
      } else {
        // Otherwise use default path based on role
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    }
  }, [user, role, isLoading, location.state, navigate]);
  
  // Show loading if auth is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // ... rest of existing code ...
}
```

#### Step 2: Same for DriverAuth.tsx

```typescript
useEffect(() => {
  if (user && role === "moderator" && !isLoading) {
    const from = location.state?.from?.pathname;
    
    if (from && from.startsWith("/driver")) {
      navigate(from, { replace: true });
    } else {
      navigate("/driver", { replace: true });
    }
  }
}, [user, role, isLoading, location.state, navigate]);
```

---

### Fix 2.2: Add Email Verification UI

**File**: Create `src/pages/VerifyEmail.tsx`  
**Purpose**: Show after user signs up

```typescript
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verified, setVerified] = useState(false);

  // Auto-verify if token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    
    if (token && type === "email_confirm") {
      verifyWithToken(token);
    }
  }, [searchParams]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const verifyWithToken = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });
      
      if (error) throw error;
      
      setVerified(true);
      toast.success("Email berhasil diverifikasi!");
      
      setTimeout(() => {
        const from = sessionStorage.getItem("authRedirect") || "/auth";
        navigate(from);
      }, 2000);
    } catch (err: any) {
      toast.error("Verifikasi gagal: " + err.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Masukkan kode verifikasi");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: "email",
      });
      
      if (error) throw error;
      
      setVerified(true);
      toast.success("Email berhasil diverifikasi!");
    } catch (err: any) {
      toast.error("Kode tidak valid: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      
      if (error) throw error;
      
      toast.success("Kode verifikasi dikirim ulang");
      setResendTimer(60); // 60 second cooldown
    } catch (err: any) {
      toast.error("Gagal mengirim: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-50 p-6 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Terverifikasi!</h1>
          <p className="text-slate-500">Email Anda telah berhasil diverifikasi. Mengalihkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <div className="bg-blue-50 p-6 rounded-full">
            <Mail className="w-16 h-16 text-blue-600" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Verifikasi Email</h1>
          <p className="text-slate-500 text-sm">
            Kami telah mengirim kode verifikasi ke:<br />
            <span className="font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Kode Verifikasi</label>
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="mt-1 text-center text-2xl tracking-widest font-bold"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-lg"
            disabled={loading}
          >
            {loading ? "Memverifikasi..." : "Verifikasi Email"}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 mb-2">Tidak menerima kode?</p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={resendTimer > 0 || loading}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {resendTimer > 0 ? `Kirim ulang dalam ${resendTimer}s` : "Kirim Ulang"}
          </Button>
        </div>

        <div className="text-xs text-slate-400 text-center">
          Tidak ada akun? <button onClick={() => navigate("/auth")} className="text-blue-600 hover:underline">Buat akun</button>
        </div>
      </div>
    </div>
  );
}
```

#### Add Route to App.tsx:
```typescript
<Route path="/verify-email" element={<VerifyEmail />} />
```

#### Update Auth.tsx signup:
```typescript
const { error } = await signUp(email, password, fullName);
if (error) throw error;

// ✅ Redirect to verification page
navigate("/verify-email?email=" + encodeURIComponent(email));
sessionStorage.setItem("authRedirect", "/auth"); // Where to go after verify
```

---

### Fix 2.3: Fix Token Refresh Strategy

**File**: `src/hooks/useAuth.ts`  
**Issue**: 50-minute hardcoded refresh with 1-hour token expiry = 10-minute risk window

#### Better Approach:

```typescript
// Add JWT decode utility at top of file
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    return null;
  }
};

// Replace the hardcoded refresh interval with expiry-based one
useEffect(() => {
  // ... existing code ...
  
  let refreshTimeout: NodeJS.Timeout;
  
  const setupTokenRefresh = () => {
    if (!session?.access_token) return;
    
    const payload = decodeJWT(session.access_token);
    if (!payload?.exp) return;
    
    // Token expiry in milliseconds
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    
    // Refresh 5 minutes before expiry
    const refreshTime = expiryTime - now - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      refreshTimeout = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            handleAuthError(error);
          } else if (data.session) {
            setSession(data.session);
            setupTokenRefresh(); // Setup next refresh
          }
        } catch (err) {
          handleAuthError(err);
        }
      }, refreshTime);
    }
  };
  
  setupTokenRefresh();
  
  return () => {
    // ... existing cleanup ...
    if (refreshTimeout) clearTimeout(refreshTimeout);
  };
}, [session, setSession, handleAuthError]);
```

---

## 🟡 PRIORITY 3: Nice-to-Have Features (LOW)

### Feature 3.1: Forgot Password Flow

**Files**: Create `src/pages/ForgotPassword.tsx` and `src/pages/ResetPassword.tsx`

#### ForgotPassword.tsx:
```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSent(true);
      toast.success("Link reset password telah dikirim");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-50 p-6 rounded-full">
              <Mail className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Email Dikirim</h1>
            <p className="text-slate-500 text-sm">
              Link reset password telah dikirim ke {email}. 
              Silakan cek email Anda dan ikuti instruksi.
            </p>
          </div>

          <Button 
            onClick={() => navigate("/auth")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Kembali ke Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full space-y-6">
        <button 
          onClick={() => navigate("/auth")}
          className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Lupa Password?</h1>
          <p className="text-slate-500 text-sm">
            Masukkan email Anda dan kami akan mengirim link untuk reset password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <Input
              type="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-lg text-white font-semibold"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### Add to App.tsx routes:
```typescript
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

#### Add link in Auth.tsx:
```typescript
<div className="pt-4 border-t border-slate-100 text-center">
  <button 
    type="button" 
    onClick={() => navigate("/forgot-password")} 
    className="text-blue-600 text-xs font-semibold hover:underline"
  >
    Lupa Password?
  </button>
</div>
```

---

## 📊 Summary Table

| Fix # | Title | File | Effort | Impact | Priority |
|-------|-------|------|--------|--------|----------|
| 1.1 | Remove Admin Redirect | Auth.tsx | 5 min | High | 🔴 TODAY |
| 1.2 | Add Form Validation | DriverAuth.tsx | 20 min | High | 🔴 TODAY |
| 2.1 | Post-Login Redirect | Auth.tsx | 30 min | Medium | 🟠 THIS WEEK |
| 2.2 | Email Verify UI | VerifyEmail.tsx | 1.5 hr | Medium | 🟠 THIS WEEK |
| 2.3 | Token Refresh Fix | useAuth.ts | 45 min | Medium | 🟠 THIS WEEK |
| 3.1 | Forgot Password | ForgotPassword.tsx | 2 hr | Low | 🟡 LATER |

---

## ✅ Testing Checklist

After implementing, test:

- [ ] User can login successfully
- [ ] Admin role redirects to /admin
- [ ] Driver role redirects to /driver
- [ ] User role stays on /
- [ ] Phone number validation works
- [ ] License number validation works
- [ ] Duplicate phone shows error
- [ ] Duplicate license shows error
- [ ] Token refreshes before expiry
- [ ] Logout clears all auth state
- [ ] Protected routes block access
- [ ] /forbidden shows for wrong role

---

**Document**: Auth Implementation Guide  
**Status**: Complete & Ready  
**Last Updated**: April 13, 2026
