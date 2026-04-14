# Auth Session Management - Complete Implementation Guide

## 📋 Overview

Comprehensive session management system with enterprise-grade security features for authentication and session lifecycle management.

**Components:**
- `SessionManagementService.ts` - Core service for session handling
- `useSessionManager.ts` - React hook for integration
- `SessionWarningDialog.tsx` - UI component for expiration warnings
- `SessionManager.tsx` - Admin component for multi-device session management
- `20260414000002_session_management.sql` - Database schema

---

## 🔒 Security Features

### 1. **Session Monitoring**
- Real-time activity tracking
- Inactivity timeout (30 minutes by default)
- Session expiration warnings (5 minutes before expiry)
- Device fingerprinting and tracking

### 2. **Token Management**
- Automatic token refresh every 50 minutes
- Refresh token expiration (7 days)
- Invalid token detection and cleanup
- Session extension before expiry

### 3. **Multi-Device Management**
- Track sessions across multiple devices
- Concurrent session limits (max 3 devices)
- Logout from specific devices
- Device information (OS, browser, IP address)

### 4. **Security Audit Trail**
- Comprehensive session audit logs
- Event logging (LOGIN, LOGOUT, TOKEN_REFRESH, SUSPICIOUS_ACTIVITY)
- IP address and user agent tracking
- Device info storage
- Suspicious activity detection

### 5. **Session Security**
- Session validation on app load
- Automatic session recovery on browser reload
- HTTPS/TLS encryption
- RLS policies for audit log access

---

## 📚 API Reference

### SessionManagementService

#### Methods

##### `initializeSession(onWarning?)`
Initialize session monitoring when user logs in.

```typescript
const session = await sessionManagement.initializeSession((warning) => {
  // Handle session warning
  console.log(warning.type, warning.message);
});
```

**Parameters:**
- `onWarning?: (warning: SessionWarning) => void` - Callback for session warnings

**Returns:** `Promise<SessionInfo | null>`

---

##### `getActiveSession()`
Get current active session details.

```typescript
const session = await sessionManagement.getActiveSession();
console.log(session?.deviceInfo, session?.expiresAt);
```

**Returns:** `Promise<SessionInfo | null>`

---

##### `refreshToken()`
Refresh authentication token (extends session).

```typescript
const success = await sessionManagement.refreshToken();
if (!success) {
  console.log("Token refresh failed - please login again");
}
```

**Returns:** `Promise<boolean>`

---

##### `extendSession()`
Explicitly extend session before expiry.

```typescript
const success = await sessionManagement.extendSession();
if (success) {
  toast.success("Session extended for 24 hours");
}
```

**Returns:** `Promise<boolean>`

---

##### `validateSession()`
Validate current session integrity.

```typescript
const isValid = await sessionManagement.validateSession();
if (!isValid) {
  // Redirect to login
}
```

**Returns:** `Promise<boolean>`

---

##### `getActiveSessions()`
Get all active sessions for current user.

```typescript
const sessions = await sessionManagement.getActiveSessions();
sessions.forEach(s => {
  console.log(`Device: ${s.deviceInfo.deviceName}, Last activity: ${s.lastActivityAt}`);
});
```

**Returns:** `Promise<SessionInfo[]>`

---

##### `revokeSession(sessionId)`
Logout from specific device/session.

```typescript
const success = await sessionManagement.revokeSession(sessionId);
if (success) {
  console.log("Session revoked successfully");
}
```

**Parameters:**
- `sessionId: string` - Session ID to revoke

**Returns:** `Promise<boolean>`

---

##### `logout()`
Logout current session.

```typescript
await sessionManagement.logout();
// Session cleared, user redirected to login
```

---

### useSessionManager Hook

React hook for integrating session management in components.

```typescript
const {
  // State
  sessionInfo,
  activeSessions,
  isSessionValid,
  showExpiryWarning,
  warningDetails,
  
  // Actions
  extendSession,
  continueSession,
  logout,
  validateSession,
  refreshToken,
  getActiveSessions,
  revokeSession,
} = useSessionManager({
  autoInitialize: true,
  onSessionWarning: (warning) => console.log(warning),
  onSessionEnd: () => console.log("Session ended"),
});
```

**Options:**
- `autoInitialize?: boolean` - Auto-init on component mount (default: true)
- `onSessionWarning?: (warning: SessionWarning) => void` - Custom warning handler
- `onSessionEnd?: () => void` - Called when session ends

---

## 🎯 Usage Examples

### 1. Basic Setup in App Component

```typescript
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionWarningDialog } from "@/components/auth/SessionWarningDialog";

export function App() {
  const {
    showExpiryWarning,
    warningDetails,
    extendSession,
    logout,
  } = useSessionManager();

  return (
    <>
      <SessionWarningDialog
        warning={warningDetails}
        isOpen={showExpiryWarning}
        onExtend={extendSession}
        onLogout={logout}
      />
      {/* Your app routes */}
    </>
  );
}
```

### 2. Session Manager Page

```typescript
import { SessionManager } from "@/components/auth/SessionManager";

export function AccountPage() {
  return (
    <div>
      <h1>Account Settings</h1>
      <SessionManager />
    </div>
  );
}
```

### 3. Manual Session Validation

```typescript
import { useSessionManager } from "@/hooks/useSessionManager";

export function SensitiveDataPage() {
  const { validateSession, logout } = useSessionManager();

  useEffect(() => {
    validateSession().then(isValid => {
      if (!isValid) {
        logout();
      }
    });
  }, []);

  return <div>Sensitive Data</div>;
}
```

### 4. Extended Session Handler

```typescript
function CustomSessionHandler() {
  const { extendSession, warningDetails } = useSessionManager({
    onSessionWarning: (warning) => {
      if (warning.type === "EXPIRING_SOON") {
        // Auto-extend session 2 minutes before expiry
        extendSession();
      }
    },
  });

  return null;
}
```

---

## 📊 Database Schema

### `session_audit_logs` Table

Stores all session-related events for audit and security.

```sql
CREATE TABLE session_audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,              -- Reference to auth user
  session_id TEXT NOT NULL,           -- Unique session identifier
  event TEXT NOT NULL,                -- LOGIN | LOGOUT | TOKEN_REFRESH | SESSION_EXTEND | SUSPICIOUS_ACTIVITY
  ip_address INET,                    -- Client IP (IPv4/IPv6)
  user_agent TEXT,                    -- Browser/client info
  device_info JSONB,                  -- Device details (OS, browser, etc)
  details JSONB,                      -- Event-specific details
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Indexes
- `user_id` - Fast user session lookup
- `session_id` - Session lookup
- `event` - Event type filtering
- `created_at` - Time-based queries
- Composite `(user_id, event)` - User event filtering

### Views

**`active_sessions`** - Sessions from last 24 hours
```typescript
SELECT user_id, session_id, device_info, activity_count FROM active_sessions;
```

**`suspicious_activities`** - Security monitoring view
```typescript
SELECT * FROM suspicious_activities WHERE logins_from_different_ips_last_hour > 1;
```

---

## ⚙️ Configuration

### Constants

```typescript
// In SessionManagementService.ts
const SESSION_WARNING_MINUTES = 5;        // Warn before expiry
const SESSION_EXPIRY_HOURS = 24;          // Session duration
const TOKEN_REFRESH_MINUTES = 50;         // Auto-refresh interval
const INACTIVITY_TIMEOUT_MINUTES = 30;    // Idle timeout
const MAX_CONCURRENT_SESSIONS = 3;        // Device limit
```

**Customize in production:**
- Increase `SESSION_EXPIRY_HOURS` for longer sessions
- Adjust `INACTIVITY_TIMEOUT_MINUTES` based on security policy
- Modify `MAX_CONCURRENT_SESSIONS` for device limits

---

## 🔐 Security Best Practices

### 1. **Always Use HTTPS**
```bash
# Verify in production
https://your-domain.com  # ✅ Sessions use secure cookies
http://localhost:3000   # ✅ OK for development
```

### 2. **Validate Sessions on Sensitive Operations**
```typescript
// Before processing payment or sensitive data
const isValid = await validateSession();
if (!isValid) {
  throw new Error("Session expired - please login again");
}
```

### 3. **Monitor Audit Logs**
```typescript
// Query suspicious activities
const { data } = await supabase
  .from("suspicious_activities")
  .select("*")
  .gt("logins_from_different_ips_last_hour", 1);

// Alert admin if suspicious
```

### 4. **Implement Rate Limiting**
```typescript
// Limit login attempts (implement in backend)
const maxAttempts = 5;
const lockoutDuration = 15 * 60 * 1000; // 15 minutes
```

### 5. **Regular Security Audits**
```typescript
// Review session logs monthly
const audit = await supabase
  .from("session_audit_logs")
  .select("*")
  .gte("created_at", thirtyDaysAgo);
```

---

## 🚀 Deployment Checklist

- [ ] Run migration: `npx supabase db push`
- [ ] Update `authStore` to use `useSessionManager`
- [ ] Add `SessionWarningDialog` to main layout
- [ ] Configure `INACTIVITY_TIMEOUT_MINUTES` for your policy
- [ ] Test token refresh in browser dev tools
- [ ] Test expiration warnings
- [ ] Verify audit logs are being recorded
- [ ] Set up admin alerts for suspicious activities
- [ ] Document session security policy for users

---

## 🧪 Testing

### Unit Tests
```typescript
describe("SessionManagementService", () => {
  it("should refresh token successfully", async () => {
    const success = await sessionManagement.refreshToken();
    expect(success).toBe(true);
  });

  it("should generate device ID", () => {
    const id1 = generateDeviceId();
    const id2 = generateDeviceId();
    expect(id1).toBe(id2); // Should be persistent
  });

  it("should detect inactivity", async () => {
    // Simulate no activity for 30 minutes
    // Should trigger logout
  });
});
```

### Integration Tests
```typescript
describe("Session Flow", () => {
  it("should track login event", async () => {
    await sessionManagement.initializeSession();
    const logs = await supabase
      .from("session_audit_logs")
      .select("*")
      .eq("event", "LOGIN");
    expect(logs.data?.length).toBeGreaterThan(0);
  });

  it("should extend session", async () => {
    const extended = await sessionManagement.extendSession();
    expect(extended).toBe(true);
  });
});
```

---

## 🐛 Troubleshooting

### Issue: Session expires immediately
**Solution:** Check `SESSION_EXPIRY_HOURS` constant - increase if needed

### Issue: Token refresh failing
**Solution:** Verify refresh token in Supabase - might need re-authentication

### Issue: Device tracking not working
**Solution:** Check `localStorage` is available in browser

### Issue: Audit logs not recording
**Solution:** Verify RLS policies on `session_audit_logs` table

### Issue: Sessions not syncing across tabs
**Solution:** Add `sessionStorage.onchange` listener for cross-tab sync

---

## 📝 Related Documentation

- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth#row-level-security)
- [RBAC Implementation](./RBAC_GUIDE.md)
- [Auth Flow Diagrams](./AUTH_FLOW_DIAGRAMS.md)

---

**Version:** 1.0  
**Last Updated:** April 14, 2026  
**Status:** Ready for Production Deployment
