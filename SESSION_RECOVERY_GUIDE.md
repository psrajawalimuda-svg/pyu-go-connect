# Session Expiration & Recovery - Implementation Guide

## 📋 Overview

Complete session expiration and recovery system with beautiful UI and secure password verification.

**Features:**
- Eye-catching SessionExpiredPage when session expires
- Secure password verification dialog for session recovery
- Auto-redirect countdown (60 seconds)
- Device-specific session recovery
- Seamless user experience (stay on same page after recovery)
- Security audit logging for recovery attempts

---

## 🎨 Components Created

### 1. **SessionExpiredPage** (`src/pages/auth/SessionExpiredPage.tsx`)

Beautiful page displayed when session expires with:
- Gradient background with animation effects
- Clear explanation of why session expired
- Session expiry information display
- Two main action buttons:
  - "Recover Session" - Opens recovery dialog
  - "Login Again" - Full logout and redirect to login
- Auto-redirect countdown (60 seconds)
- Security notes and help links
- Responsive design

**Visual Elements:**
- Animated gradient background
- Floating blur effects
- Centered card with premium styling
- Icon with pulsing animation
- Alert boxes for information

### 2. **SessionRecoveryDialog** (`src/components/auth/SessionRecoveryDialog.tsx`)

Beautiful modal dialog for password verification with:
- Two-step flow (verify → success)
- Password input with show/hide toggle
- Email display confirmation
- Attempt counter (max 5 attempts)
- Auto-lockout after failed attempts (5 minutes)
- "Forgot Password" link for account recovery
- Success state with checkmark animation
- Security notes and best practices
- Smooth transitions

**Features:**
- Secure password validation via Supabase
- Rate limiting (5 attempts, 5-minute lockout)
- User-friendly error messages
- Eye/EyeOff icon for password visibility
- Loading states
- Success confirmation before redirect

### 3. **SessionRecoveryWrapper** (`src/components/layout/SessionRecoveryWrapper.tsx`)

High-order component that wraps protected routes:
- Integrates with session management
- Shows SessionExpiredPage when session expires
- Handles session recovery and validation
- Maintains role-based access control
- Preserves current location after recovery
- Smooth authentication flows

---

## 🚀 Quick Setup

### Step 1: Update App.tsx - Replace ProtectedRoute with SessionRecoveryWrapper

**Before:**
```typescript
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

<Route element={<ProtectedRoute requiredRole="admin" />}>
  <Route path="/admin" element={<AdminLayout />}>
```

**After:**
```typescript
import { SessionRecoveryWrapper } from "@/components/layout/SessionRecoveryWrapper";

<Route element={<SessionRecoveryWrapper requiredRole="admin" />}>
  <Route path="/admin" element={<AdminLayout />}>
```

### Step 2: Apply to All Protected Routes

Replace all instances of `<ProtectedRoute` with `<SessionRecoveryWrapper`:

```bash
# Find all occurrences
grep -r "ProtectedRoute" src/App.tsx

# Examples that need updating:
# - Admin routes
# - Driver routes  
# - User profile/wallet routes
```

### Step 3: Test Session Expiration

1. Login to your account
2. Set `SESSION_EXPIRY_HOURS = 0.001` (test value = ~3 seconds)
3. Wait for SessionExpiredPage to appear
4. Click "Recover Session" to open dialog
5. Enter your password
6. Should see success message and return to same page
7. Reset `SESSION_EXPIRY_HOURS = 24` after testing

---

## 🎯 User Flows

### Flow 1: Natural Session Expiration

```
User logged in (24 hours) → Session expires → 
SessionExpiredPage shown → User verifies password → 
Session recovered → Return to same page
```

### Flow 2: Inactivity Timeout

```
User inactive (30 min) → Warning dialog → 
User ignors (5 min) → Forced logout → 
SessionExpiredPage shown → Can recover with password
```

### Flow 3: Forgot Password

```
SessionExpiredPage → Click "Recover Session" → 
SessionRecoveryDialog → Click "Forgot Password?" → 
Reset email sent → User resets password → 
Can login with new password
```

### Flow 4: Multiple Failed Attempts

```
Enter wrong password (5 times) → Account locked for 5 min → 
Error message shown → User can reset password → 
Auto-unlock after 5 minutes
```

---

## 📱 UI/UX Details

### SessionExpiredPage Colors
- **Background**: Gradient slate (900 → 800 → 900)
- **Card**: White with backdrop blur
- **Primary CTA**: Blue to Purple gradient
- **Secondary CTA**: Neutral outline
- **Alerts**: Blue background with blue text
- **Icons**: Colorful gradient backgrounds

### SessionRecoveryDialog Colors
- **Header Icon**: Blue to Purple gradient
- **Title**: Slate 900
- **Error**: Red 50 background, Red 800 text
- **Security Note**: Blue 50 background, Blue 900 text
- **CTA**: Blue to Purple gradient
- **Success**: Green background with checkmark

### Responsive Breakpoints
- Mobile: Full width with padding
- Tablet: Max-width 600px
- Desktop: Max-width 500px centered

---

## 🔒 Security Measures

### 1. **Password Verification**
- User must enter password to recover session
- Password sent to Supabase for verification
- No password stored or logged
- HTTPS/TLS encryption enforced

### 2. **Rate Limiting**
- Maximum 5 failed attempts
- 5-minute lockout after max attempts
- Clear attempt counter to user
- Option to reset password during lockout

### 3. **Audit Logging**
- Recovery attempts logged to `session_audit_logs`
- Failed attempts tracked with timestamps
- IP address and device info stored
- Admin can monitor suspicious activity

### 4. **Session Validation**
- Session must be valid to recover
- Token expiration checked
- Refresh token validated
- Session integrity verified

---

## 💻 API Integration

### useSessionManager Functions Used

```typescript
// Provide session expired callback
const { isSessionExpired, sessionExpiredTime, recoverSession, logout } = 
  useSessionManager({
    autoInitialize: true,
    onSessionWarning: (warning) => {
      if (warning.type === "EXPIRING_SOON") {
        // Auto-extend 2 min before expiry
      }
    },
  });

// In SessionExpiredPage
<Button onClick={() => {
  const success = await recoverSession();
  if (success) navigate(originalPage);
}}>
  Recover Session
</Button>
```

### Supabase Auth Integration

```typescript
// SessionRecoveryDialog uses standard Supabase auth
const { error } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: password,
});

if (!error) {
  // Token refreshed, session valid
  await supabase.auth.refreshSession();
}
```

---

## 🎨 Customization

### Adjust Timeout Values

**In SessionManagementService.ts:**
```typescript
const SESSION_EXPIRY_HOURS = 24;           // Change to 12, 48, etc
const SESSION_WARNING_MINUTES = 5;         // Change to 10, 15, etc
const INACTIVITY_TIMEOUT_MINUTES = 30;     // Change to 20, 60, etc
const MAX_CONCURRENT_SESSIONS = 3;         // Change to 2, 5, etc
```

### Customize SessionExpiredPage Colors

**In SessionExpiredPage.tsx:**
```typescript
// Change gradient colors
<div className="bg-gradient-to-br from-[your-color] via-[your-color] to-[your-color]">

// Change button colors
className="bg-gradient-to-r from-[color-1] to-[color-2]"
```

### Adjust Auto-Redirect Time

**In SessionExpiredPage.tsx:**
```typescript
// Change from 60 to different value (seconds)
autoRedirectSeconds={60}  // → 30, 120, etc
```

### Custom Recovery Logic

**In SessionRecoveryDialog.tsx:**
```typescript
// Add custom logic after successful recovery
if (refreshError || !data.session) {
  // Custom error handling
  customErrorHandler(error);
}

// Before redirect
setTimeout(() => {
  onSuccess?.();  // Call custom callback
  // Add extra logic here
}, 2000);
```

---

## 🧪 Testing Checklist

- [ ] Session expires after 24 hours
- [ ] SessionExpiredPage displays correctly
- [ ] Recover Session button opens dialog
- [ ] Correct password recovers session
- [ ] Wrong password shows error
- [ ] 5th failed attempt locks account
- [ ] Forgot Password link works
- [ ] Success state displays animation
- [ ] Redirect back to original page works
- [ ] Login Again button redirects to login
- [ ] Auto-redirect countdown works
- [ ] Mobile responsive layout
- [ ] Dark mode (if applicable)
- [ ] Session audit logs created
- [ ] Device info tracked correctly

---

## 🐛 Troubleshooting

### Issue: SessionExpiredPage not showing
**Solution**: 
- Check `SESSION_EXPIRY_HOURS` is set to valid number
- Verify `useSessionManager` auto-initialize is true
- Check browser console for errors

### Issue: Password recovery fails
**Solution**:
- Verify user email exists in auth system
- Check Supabase connection
- Verify RLS policies allow auth
- Check password is correct

### Issue: Auto-redirect not working
**Solution**:
- Check `navigate` hook is imported
- Verify route exists
- Check browser console for navigation errors

### Issue: Multiple sessions showing
**Solution**:
- Check `MAX_CONCURRENT_SESSIONS` limit
- Verify old sessions are being cleaned up
- Check session revocation working

---

## 📊 Analytics & Monitoring

### Track Session Recoveries

```typescript
// Query recovered sessions
const { data: recoveries } = await supabase
  .from("session_audit_logs")
  .select("*")
  .eq("event", "SESSION_EXTEND")
  .gte("created_at", sevenDaysAgo);

console.log(`Sessions recovered: ${recoveries?.length}`);
```

### Monitor Failed Recovery Attempts

```typescript
const { data: failures } = await supabase
  .from("session_audit_logs")
  .select("*, user_id, details")
  .eq("event", "LOGIN")
  .eq("details->failed", true)
  .gte("created_at", lastHour);

// Alert on suspicious patterns
```

---

## 🚀 Deployment Checklist

- [ ] Update all `ProtectedRoute` to `SessionRecoveryWrapper` in App.tsx
- [ ] Test session expiration flow locally
- [ ] Verify password recovery works
- [ ] Check SessionExpiredPage displays correctly
- [ ] Test on mobile devices
- [ ] Verify audit logs are created
- [ ] Set production `SESSION_EXPIRY_HOURS` (24 recommended)
- [ ] Configure auto-redirect time (60s recommended)
- [ ] Document process for users
- [ ] Monitor recovery attempts for first week

---

## 📚 Related Files

- `SessionManagementService.ts` - Session monitoring
- `useSessionManager.ts` - React integration
- `SessionWarningDialog.tsx` - Expiration warnings
- `SessionManager.tsx` - Device management
- `SESSION_MANAGEMENT_GUIDE.md` - Full documentation

---

**Version:** 1.0  
**Created:** April 14, 2026  
**Status:** ✅ Ready for Production
