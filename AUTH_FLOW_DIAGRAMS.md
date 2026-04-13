# Authentication Flow Diagrams & Visual Architecture

## 🔄 Complete Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP INITIALIZATION                       │
│  1. useAuth() hook runs on app mount                            │
│  2. Checks Supabase session (recovery from URL)                 │
│  3. Sets up auth state listener                                 │
│  4. Fetches user role from user_roles table                     │
│  5. Sets up token refresh interval (50 min)                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼───────┐     ┌──────▼────────┐
            │   LOGGED IN   │     │  NOT LOGGED   │
            │   (User set)  │     │   IN (null)   │
            └───────┬───────┘     └──────┬────────┘
                    │                    │
        ┌───────────┼────────────┐       │
        │           │            │       │
    ┌───▼──┐    ┌──▼───┐    ┌──▼───┐    │
    │Admin │    │Driver│    │ User │    │
    │(role)│    │(role)│    │(role)│    │
    └───┬──┘    └──┬───┘    └──┬───┘    │
        │         │           │        │
    [/admin]  [/driver]     [/]  ┌────┴────────┐
        │         │           │   │             │
        │         │           │  [/auth]  [/driver/auth]
        │         │           │   │             │
        └─────┬───┴───────────┘   └─────┬───────┘
              │                          │
              └──────────────┬───────────┘
                             │
                    (return after login)
```

---

## 🔐 User Login Flow

```
┌─────────────┐
│  /auth      │
│  PAGE       │
└──────┬──────┘
       │
       │ User enters email & password
       ▼
┌──────────────────────────────────┐
│ Click "Masuk" (Login)            │
│ - Email validation               │
│ - Password validation (min 6)    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ supabase.auth.signInWithPassword()│
│ Returns: { user, session, error }│
└──────┬───────────────────────────┘
       │
       ├─ ERROR ─────────────────┐
       │                         │
       ▼                         ▼
┌─────────────┐         ┌──────────────┐
│ Show Error  │         │ Toast Error  │
│ Toast       │         │ Message      │
└─────────────┘         └──────────────┘
       │
       ├─ SUCCESS ────────────────────┐
       │                              │
       ▼                              ▼
┌─────────────────────────────────────────┐
│ useAuth hook processes:                  │
│ 1. Sets session in authStore            │
│ 2. Fetches user role from user_roles    │
│ 3. Updates permissions based on role    │
└─────────────┬───────────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Role Check?   │
      └───┬─────┬─────┘
          │     │
      ┌───┴─┐   └─────┬──────────┐
      │     │         │          │
  [admin] [moderator][user]   [other]
      │     │         │          │
      ▼     ▼         ▼          ▼
    /admin /driver   /        (default)

NOTE: Current code tries to redirect in Auth.tsx
      but this is handled by ProtectedRoute
```

---

## 🚀 Driver Registration Flow

```
┌─────────────────┐
│ /driver/auth    │
│ PAGE            │
│ (Registration)  │
└────────┬────────┘
         │
         │ switch isLogin to false
         ▼
┌──────────────────────────┐
│ Show Registration Form:  │
│ - Full Name              │
│ - Email                  │
│ - Password (min 6)       │
│ - Phone Number           │
│ - License Number (SIM)   │
└────────┬─────────────────┘
         │
         │ User enters all fields
         ▼
┌─────────────────────────────────────┐
│ Validation ⚠️                       │
│ ❌ Phone format NOT validated       │
│ ❌ License format NOT validated     │
│ ✅ Email required                   │
│ ✅ Password min 6 chars             │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ useAuth.signUp() - checks        │
│ 1. Phone already registered?     │
│ 2. License already registered?   │
│ 3. ❌ Email duplication check    │
│    missing!                      │
└────────┬─────────────────────────┘
         │
         ├─ DUPLICATE FOUND ──────────┐
         │                            │
         ▼                            ▼
    ┌─────────┐              ┌──────────────┐
    │ Error   │              │ Toast Error  │
    └─────────┘              │ "Already     │
                             │ registered"  │
                             └──────────────┘
         │
         ├─ NO DUPLICATE ──────────────┐
         │                             │
         ▼                             ▼
┌────────────────────────────────────────┐
│ supabase.auth.signUp({                 │
│   email,                               │
│   password,                            │
│   options: {                           │
│     data: {                            │
│       full_name: fullName              │
│       phone: phone                     │
│       license_number: licenseNumber    │
│       is_driver: true                  │
│     }                                  │
│   }                                    │
│ })                                     │
└────────┬─────────────────────────────┘
         │
         ▼
   ┌─────────────────────┐
   │ DB Trigger Runs:    │
   │ handle_new_user     │
   │ 1. Create profile   │
   │ 2. Create role      │
   │ 3. Create driver    │
   └────────┬────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ Email Verification Sent      │
   │ (User must confirm email)    │
   └────────┬─────────────────────┘
            │
            ▼
   ┌──────────────────────────────┐
   │ Show Success Toast           │
   │ "Check your email"           │
   │ Switch to Login Form         │
   └──────────────────────────────┘
```

---

## 🔑 Protected Route Access Flow

```
┌──────────────────────────┐
│ User navigates to        │
│ /driver/profile (or      │
│ /driver/*, /admin/*)     │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ProtectedRoute Component Runs       │
│ 1. Check if authenticated           │
│ 2. Check if role matches            │
│ 3. Check if permission granted      │
└────────┬────────────────────────────┘
         │
         ├─ NOT AUTHENTICATED ────┐
         │                        │
         ▼                        ▼
    ┌─────────┐         ┌──────────────────┐
    │ authLoading       │ <Navigate to:    │
    │ && !user?         │ WRONG redirecting
    │                   │ mid-fetch!       │
    ▼                   └──────────────────┘
    Show Loading Spinner

    Wait for auth to complete
    │
    ├─ User confirmed ──► Navigate to /auth or /driver/auth
    │
    └─ User denied ────► Show loading until timeout

         │
         ├─ ROLE MISMATCH ────────┐
         │                        │
         ▼                        ▼
    ┌──────────────┐    ┌──────────────────┐
    │ requiredRole │    │ <Navigate to     │
    │ != user role │    │ /forbidden       │
    │              │    │ state={{ from }} │ ← Not used!
    └──────────────┘    └──────────────────┘
         │
         ├─ PERMISSION CHECK ─────┐
         │                        │
         ▼                        ▼
    ┌─────────────┐    ┌──────────────────┐
    │ Permission  │    │ <Navigate to     │
    │ granted?    │    │ /forbidden>      │
    └──────┬──────┘    └──────────────────┘
           │
           ├─ ALL CHECKS PASS ──→ ┌──────────────┐
           │                     │ <Outlet />   │
           │                     │ Render page  │
           │                     └──────────────┘
           │
           └─ FAILURE ──────────→ Redirect to /forbidden or /auth
```

---

## 📊 Role & Permission Hierarchy

```
                        ┌─────────┐
                        │  Admin  │
                        └────┬────┘
                             │
                   ┌─ All Permissions ─┐
                   │                   │
          ┌────────┼────────┐   ┌──────┴──────┐
          │        │        │   │             │
      ┌───▼──┐ ┌──▼──┐ ┌──▼─┐ │             │
      │ Ride │ │Admin│ │Drvr│ │             │
      │CRUD  │ │Mgmt │ │Loc │ │             │
      └──────┘ └─────┘ └────┘ │             │
                               │             │
                        ┌──────▼──┐  ┌──────▼──────┐
                        │Moderator│  │    User     │
                        │ (Driver)│  │  (Passenger)│
                        └────┬────┘  └─────┬────────┘
                             │            │
                    Limited  │            │  Basic
                    Ops      │            │  Ops
                             │            │
                    ┌────────┴┐      ┌───┴─────────┐
                    │ Read    │      │ Ride:Create │
                    │ Update  │      │ Ride:Read   │
                    │ Location│      │ Wallet:Pay  │
                    │ Status  │      │             │
                    └────────┘      └─────────────┘
```

---

## 🔄 Session Lifecycle

```
┌──────────────────────────────────────┐
│ LOGIN                                │
│ session.access_token expires in 1h   │
│ session.refresh_token stored         │
└─────────────┬────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ TOKEN VALID         │
    │ (0-55 minutes)      │
    │ ✅ User active      │
    └─────────┬───────────┘
              │
              │ [Token refresh timer set for 50 min]
              │
              ▼
    ┌─────────────────────┐
    │ AUTO REFRESH at 50m │
    │ supabase.auth       │
    │ .refreshSession()   │
    └─────────┬───────────┘
              │
        ┌─────┴──────┐
        │            │
    ┌───▼──┐    ┌────▼───┐
    │PASS  │    │FAIL    │
    │      │    │        │
    └───┬──┘    └────┬───┘
        │            │
        ▼            ▼
    ┌─────────┐  ┌──────────┐
    │Token    │  │Sign Out  │
    │Renewed  │  │Silently  │
    │(+1hr)   │  │Clear     │
    └────┬────┘  │Session   │
         │       └────┬─────┘
         │            │
         └─────┬──────┴──────┐
               ▼             ▼
         [Next 50min]  [Redirect to /auth]
               
  ⚠️ ISSUE: If refresh fails, user is signed out
           without warning during use!
```

---

## 🚨 Current Flow Issues - Visual

### Issue 1: Admin Redirect Race Condition
```
Auth.tsx (lines 24-35)
┌────────────────────────────┐
│ const { error } =          │
│   await signIn(...)        │ ← Returns immediately
└────────────────┬───────────┘
                 │
         ❌ PROBLEM: Auth state hasn't updated yet
                 │
         ┌───────▼───────────┐
         │ const roleData =   │
         │ supabase.from(...) │ ← Queries DB separately
         └───────┬───────────┘
                 │
         ❌ PROBLEM: Race condition! May get old role
                 │
         ┌───────▼──────────────┐
         │ navigate(roleData...) │ ← Redirect based on stale data
         └──────────────────────┘
         
✅ SOLUTION: Remove this logic, let useAuth handle it
             useAuth hook already fetches role automatically
```

### Issue 2: Unverified Email State Not Handled
```
User Signs Up
     │
     ▼
Email Sent
     │
     ├─ User doesn't verify → ❌ BROKEN STATE
     │   • Can't use account
     │   • No resend button shown
     │   • No clear next steps
     │   • No timer
     │
     └─ User verifies ✅ OK
            │
            ▼
        Can Login
```

### Issue 3: Phone/License Validation Missing
```
Driver Registration Form
     │
     ├─ Phone: "12345"      ← ❌ NOT VALIDATED (too short)
     │
     ├─ License: "abc"      ← ❌ NOT VALIDATED (not numeric)
     │
     └─ Form Submitted
            │
            ▼
     Backend Check
            │
            ├─ Duplicate? Check
            │
            └─ Format? ❌ NOT CHECKED
                       • Should be 8-12 digits
                       • Should match Indonesia format
```

---

## ✨ Recommended Auth Flow (After Fixes)

```
LOGIN PAGE                                  CODE
┌──────────────────┐
│  Email Input     │                   Form validation
│  Password Input  │────────────────────────────────┐
│  [Login Button]  │                                │
└──────────────────┘                                ▼
                              ┌────────────────────────┐
                              │ Check form validity    │
                              │ - Email format         │
                              │ - Password length      │
                              └────────────┬───────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │ Call useAuth.signIn()  │
                              │ - Supabase login       │
                              │ - JWT token stored     │
                              └────────────┬───────────┘
                                           │
                    ┌──────────────────────┴──┐
                    │                         │
                Success                    Fail
                    │                         │
                    ▼                         ▼
            ┌──────────────┐      ┌────────────────┐
            │ useAuth Hook │      │ Show Error     │
            │ Auto:        │      │ Toast + Stay   │
            │ 1. Sets role │      │ on Form        │
            │ 2. Updates   │      │                │
            │    perms     │      └────────────────┘
            │ 3. Downloads │
            │    profile   │
            └────────┬─────┘
                     │
                     ▼
            ┌──────────────┐
            │ App Routing  │
            │ Checks role  │
            │ Auto-renders │
            │ correct home │
            └──────────────┘

RESULT: No manual redirects, all automatic!
```

---

## 🎯 Implementation Priority Diagram

```
                          PRIORITY MAP
                         (Time vs Value)

High Value
    ↑
    │     ┌─ Remove Admin
    │     │  Redirect Bug
    │     │
    │  ┌──┴────┐
    │  │        │ Add Form
    │  │        │ Validation
    │  │        │
    │  │     ┌──┴────┐
    │  │     │        │ Redirect
    │  │     │        │ After
    │  │     │        │ Login
    │  │     │        │
    │  │     │     ┌──┴────┐
    │  │     │     │        │ Email
    │  │     │     │        │ Verification
    │  │     │     │        │ UI
    │  │     │     │        │
Low │  │     │     │        │ Token
    │  │     │     │        │ Refresh
    │  │     │     │        │ Fix
    │  │     │     │        │
    └──┴─────┴─────┴────────┴────→ Time
    5min   30min  1hr     2hr     3hr
    
    │
    ├─ Quick wins (5-30 min)
    ├─ Medium effort (1-2 hours)
    └─ Major refactor (3+ hours)
```

---

## 📈 Metrics to Track

```
After implementing fixes, measure:

1. Login Success Rate
   Current: ? (should be >99%)
   
2. Average Login Time
   Current: ? (target: <1 second)
   
3. Session Timeout Events
   Current: ? (track refresh failures)
   
4. Invalid Token Recovery
   Current: ? (should auto-recover)
   
5. Redirect Errors
   Current: ? (should be 0)
   
6. Form Validation Errors
   Current: ? (track invalid driver registrations)
```

---

**Update**: April 13, 2026
**Status**: Visual Architecture Complete
**Next**: Implementation of Priority 1-3 items
