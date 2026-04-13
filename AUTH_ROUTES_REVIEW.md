# Authentication Routes & Flow Review

**Date**: April 13, 2026  
**Status**: 🔍 Review Complete  
**Priority**: 📌 Medium (Best practices refinement)

---

## 📊 Current Architecture Overview

### Auth Routes Structure
```
/auth                    → User login/registration
/driver/auth             → Driver login/registration  
/driver/*                → Protected (requires "moderator" role)
/admin/*                 → Protected (requires "admin" role)
/forbidden               → Access denied page
/                        → Public landing page
```

### Authentication Flow
```
User/Driver
   ↓
Auth Page (/auth or /driver/auth)
   ↓
Supabase.auth.signUp/signIn
   ↓
handle_new_user trigger (creates profile, role, driver record)
   ↓
Role assignment (via user_roles table)
   ↓
ProtectedRoute checks role
   ↓
Redirect to dashboard or /forbidden
```

---

## ✅ Current Implementation - What's Working Well

### 1. **Dual Auth Flows** ✅
- Separate routes for user (/auth) and driver (/driver/auth)
- Clear UI distinction between roles
- Driver-specific requirements (phone, license number)
- Proper styling distinction (emerald for driver, primary for user)

### 2. **Role-Based Access Control** ✅
- Three-tier system: admin, moderator (driver), user
- ProtectedRoute component handles role checking
- useRBAC hook for permission-based features
- Can component for granular UI control

### 3. **Session Management** ✅
- Token refresh every 50 minutes (prevents expiration)
- Automatic session recovery on app reload
- Proper error handling for invalid tokens
- Auth state persisted in Zustand store

### 4. **Error Handling** ✅
- Toast notifications for user feedback
- Invalid refresh token detection
- Duplicate driver validation (phone, license)
- Proper error messages in Indonesian

### 5. **Security Features** ✅
- Password minimum length (6 chars)
- Email verification required for signup
- Role-based access protection
- Admin/moderator role restriction for sensitive routes

---

## ⚠️ Issues & Improvements Needed

### Issue 1: **Admin Role Redirect After Login Not Implemented**
**Location**: `src/pages/Auth.tsx` (lines 27-35)  
**Problem**: Auth.tsx has code to redirect admin to /admin, but this logic is incomplete/unreachable

```typescript
// Current implementation
if (roleData?.role === "admin") {
  navigate("/admin");
} else {
  navigate("/");
}
```

**Issues**:
- This block is unreachable after successful login (signIn returns immediately)
- Role check happens after signIn, but redirect happens before auth state updates
- Race condition: navigate happens before useAuth hook processes role

**Recommendation**: Remove this logic - let ProtectedRoute handle redirects

---

### Issue 2: **Inconsistent Redirect Logic**
**Locations**: 
- `Auth.tsx` (line ~32): Tries to redirect to /admin
- `DriverAuth.tsx` (line ~29): Redirects to /driver
- `useAuth.ts` (line ~173): Redirects to /auth on logout

**Problem**: Multiple redirect patterns create confusion and potential bugs

**Recommended Pattern**:
```
1. Login successful → Store token in session
2. useAuth hook fetches role (via query, not manual redirect)
3. User component renders based on auth state
4. ProtectedRoute enforces access (not signup page)
```

---

### Issue 3: **Admin Signup Not Possible**
**Location**: `src/pages/Auth.tsx` and `src/pages/driver/DriverAuth.tsx`  
**Problem**: No admin signup flow - admins must be created by database admins

**Current Status**: ✅ Acceptable (security by design)  
**Recommendation**: Document this requirement

---

### Issue 4: **Missing Email Verification Handling**
**Location**: All auth pages  
**Problem**: No UI feedback for unverified email accounts

**Current Behavior**:
- User signs up → Gets "Check email" toast
- No way to resend verification email
- No confirmation page
- No verification status check

**Recommendation**: Add email verification UI

---

### Issue 5: **Password Reset Not Implemented**
**Locations**: `/auth` and `/driver/auth`  
**Problem**: No password recovery flow

**Current**: Users must contact support  
**Recommendation**: Add forgot password functionality

---

### Issue 6: **Race Condition in Auth Redirect**
**Location**: `src/pages/Auth.tsx` (lines 27-35)

```typescript
// WRONG - Race condition
const { error } = await signIn(email, password);
// ... immediately check role

// Role hasn't updated yet - this check will fail or use stale data
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", (await supabase.auth.getUser()).data.user?.id);
```

**Better Approach**: Let useAuth hook handle role fetching

---

### Issue 7: **No Redirect State Preservation**
**Location**: `ProtectedRoute.tsx` (lines 17-18)

```typescript
// Routes save "from" location but Auth page doesn't use it
return <Navigate to={loginPath} state={{ from: location }} replace />;
```

**Issue**: After login, user isn't redirected back to original page  
**Impact**: User loses context (tries to access /driver/profile → redirects to /driver/auth → redirects to /driver)

---

### Issue 8: **Token Refresh Interval Too Aggressive**
**Location**: `useAuth.ts` (line ~85)

```typescript
const refreshInterval = setInterval(async () => {
  // ... refresh every 50 minutes
}, 1000 * 60 * 50);
```

**Issues**:
- 50 minute refresh means 10 minute unused sessions expire
- Supabase default token expiry is 1 hour
- If user is inactive for 10 min past refresh failure, they're logged out
- Multiple refreshes happening in background

**Recommendation**: Adjust to 55 minutes or use expiry-based refresh

---

### Issue 9: **Driver Registration Missing Validations**
**Location**: `DriverAuth.tsx` (lines 14-40)

**Missing**:
- Phone number format validation (not just required)
- License number format validation
- License expiry check (should be future date)
- Age verification

**Format Issues**:
- License: Should be 8-12 digits for Indonesia
- Phone: Should start with +62 or 0 and be 10-12 digits

---

### Issue 10: **Duplicate Driver Check Incomplete**
**Location**: `useAuth.ts` (lines 120-138)

```typescript
// Only checks phone and license
// Missing: Check if email already registered as driver
```

**Recommendation**: Also verify email uniqueness

---

### Issue 11: **RBAC Roles Mismatch in Comments**
**Location**: `rbac.ts` (line ~14)

```typescript
moderator: [ // Driver role
  // ... but "moderator" is confusing name for driver role
]
```

**Issue**: "moderator" doesn't clearly indicate "driver"  
**Recommendation**: Create type alias or update naming

---

### Issue 12: **No Session Extension UI**
**Issue**: When token expires, user is kicked to login without warning  
**Current**: Silent background refresh (might fail)  
**Recommendation**: Show session expiration warning before logout

---

## 🔧 Recommended Refinements

### Priority 1: Fix Race Condition (**HIGH**)

**Current Problem in Auth.tsx**:
```typescript
// BEFORE
const { error } = await signIn(email, password);
// Role not fetched yet
const { data: roleData } = await supabase.from("user_roles")...
navigate(roleData?.role === "admin" ? "/admin" : "/");
```

**Recommended Solution**:
```typescript
// BETTER - Remove manual redirect
const { error } = await signIn(email, password);
if (error) {
  toast.error(err.message);
  return;
}
// Don't redirect - let app routing handle it
toast.success("Login successful");
// useAuth hook will update, ProtectedRoute will enforce
```

**Why**: useAuth hook already handles role fetching and app state updates automatically

---

### Priority 2: Add Redirect After Login (**MEDIUM**)

**Enhancement to ProtectedRoute and useAuth**:
```typescript
// In useAuth - return redirect target
const getRedirectAfterAuth = () => {
  if (role === "admin") return "/admin";
  if (role === "moderator") return "/driver";
  return "/";
};

// In Auth.tsx
const { ...auth } = useAuth();
useEffect(() => {
  if (auth.user && auth.role && !isLogin) {
    const target = auth.role === "admin" ? "/admin" : "/";
    navigate(target, { replace: true });
  }
}, [auth.user, auth.role]);
```

---

### Priority 3: Implement Redirect Back to Original Page (**MEDIUM**)

**Current**: useNavigate() in ProtectedRoute saves state but doesn't use it

**Enhancement**:
```typescript
// In Auth.tsx after successful login
const location = useLocation();
useEffect(() => {
  if (user && role && !isLoading) {
    const from = location.state?.from?.pathname;
    if (from && from !== "/auth") {
      navigate(from, { replace: true });
    } else {
      const defaultPath = role === "admin" ? "/admin" : "/";
      navigate(defaultPath, { replace: true });
    }
  }
}, [user, role, isLoading, location.state]);
```

---

### Priority 4: Add Form Validations to DriverAuth (**MEDIUM**)

**Enhancement to DriverAuth.tsx**:
```typescript
const validateDriverForm = () => {
  const errors: Record<string, string> = {};
  
  // Phone: Indonesian format
  if (!phone.match(/^(\+62|0)[0-9]{9,11}$/)) {
    errors.phone = "Gunakan format: +628xxxx atau 08xxxx";
  }
  
  // License: 8-12 digits
  if (!licenseNumber.match(/^\d{8,12}$/)) {
    errors.licenseNumber = "Nomor SIM harus 8-12 digit";
  }
  
  return errors;
};
```

---

### Priority 5: Add Email Verification UI (**MEDIUM**)

**New Component: VerifyEmail.tsx**
```typescript
// Show after signup with:
// - Confirmation code submission field
// - "Resend email" button
// - Timer before resend is allowed (60 seconds)
// - Link back to login
// - Clear instructions in Indonesian
```

---

### Priority 6: Fix Token Refresh Strategy (**MEDIUM**)

**Current Issue**: 50-minute refresh cycle with 1-hour token expiry = risky

**Better Approach**:
```typescript
// In useAuth.ts
const setupTokenRefresh = () => {
  // Get actual token expiry from JWT decode
  const getTokenExpiry = () => {
    const token = session?.access_token;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // In milliseconds
  };

  // Refresh 5 minutes before expiry
  const expiry = getTokenExpiry();
  const refreshTime = expiry - Date.now() - (5 * 60 * 1000);
  
  const timeout = setTimeout(refreshToken, Math.max(refreshTime, 0));
  return () => clearTimeout(timeout);
};
```

---

### Priority 7: Add Forgot Password Flow (**LOW**)

**New Route**: `/auth/forgot-password`

```typescript
// ForgotPassword.tsx
- Email input field
- Submit handler: supabase.auth.resetPasswordForEmail(email)
- Success message: "Check your email for reset link"
- Link back to login

// ResetPassword.tsx
- New password input
- supabase.auth.updateUser({ password: newPassword })
- Redirect to login with success message
```

---

## 📋 Implementation Checklist

### Immediate (Today)
- [ ] Remove broken admin redirect logic from Auth.tsx
- [ ] Document that admins cannot self-register
- [ ] Update comments (moderator → driver role)

### This Sprint
- [ ] Add driver form validations (phone, license format)
- [ ] Add duplicate email check in signup
- [ ] Implement post-login redirect to original page
- [ ] Add redirect auto-close in ProtectedRoute

### Next Sprint
- [ ] Implement email verification UI
- [ ] Fix token refresh strategy (expiry-based)
- [ ] Add password reset flow
- [ ] Add forgotten password link to login pages

### Nice to Have
- [ ] Session expiration warning modal
- [ ] Biometric login option (fingerprint/face)
- [ ] Social login (Google, Apple)
- [ ] Two-factor authentication

---

## 🛡️ Security Audit

### ✅ Currently Secure
- Password minimum 6 characters
- Email verification required
- Role-based access control
- Token refresh mechanism
- SQL injection prevention (Supabase)
- HTTPS only cookies

### ⚠️ Consider Adding
- CORS configuration review
- Rate limiting on auth endpoints
- Account lockout after N failed attempts
- Suspicious activity detection
- Two-factor authentication
- API key rotation strategy

### Code Review Notes
- Private identifier warnings in TypeScript
- esModuleInterop flag needs setting
- JSX configuration in tsconfig

---

## 📝 Summary of Changes Needed

| Issue | Severity | Fix Time | Impact |
|-------|----------|----------|--------|
| Remove broken admin redirect | HIGH | 5 min | Prevents confusion |
| Add driver form validation | HIGH | 30 min | UX improvement |
| Fix redirect after login | MEDIUM | 45 min | UX improvement |
| Implement email verification | MEDIUM | 2 hours | Better UX |
| Fix token refresh | MEDIUM | 1 hour | Stability |
| Add forgot password | LOW | 3 hours | Feature completeness |

---

## ✨ Next Steps

1. **Review with team** - Confirm priorities
2. **Create tickets** - Break into manageable tasks
3. **Implement fixes** - Start with HIGH priority items
4. **Test thoroughly** - Auth flows are critical
5. **Deploy incrementally** - Don't change everything at once

---

## 📚 Related Documentation

- `DRIVER_PROFILE_INTEGRATION_COMPLETE.md` - Driver features
- `RBAC_GUIDE.md` - Role-based access control
- `DRIVER_ADMIN_IMPLEMENTATION.md` - Admin features

---

## 🔍 Code References

**Key Files**:
- `src/pages/Auth.tsx` - User auth page
- `src/pages/driver/DriverAuth.tsx` - Driver auth page
- `src/hooks/useAuth.ts` - Auth logic (160 lines)
- `src/components/layout/ProtectedRoute.tsx` - Route protection
- `src/stores/authStore.ts` - Auth state
- `src/lib/rbac.ts` - Role/permission definitions

**Configuration**:
- Query Client: 2min stale, 5min cache, no window focus refetch
- Token Refresh: Every 50 minutes
- Session Check: On app load and auth state changes

---

**Document Version**: 1.0  
**Last Updated**: April 13, 2026  
**Status**: Ready for Review & Implementation
