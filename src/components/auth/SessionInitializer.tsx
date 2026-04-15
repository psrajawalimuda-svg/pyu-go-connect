/**
 * Integration Guide for Session Management in App
 * 
 * Follow these steps to integrate session management into your main App component
 */

import { useEffect } from "react";
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionWarningDialog } from "@/components/auth/SessionWarningDialog";
import { useAuth } from "@/hooks/useAuth";

/**
 * SessionInitializer - Component to initialize session management on app load
 * Place this in your main App.tsx layout
 */
export function SessionInitializer() {
  const { user } = useAuth();
  const {
    showExpiryWarning,
    warningDetails,
    extendSession,
    logout,
  } = useSessionManager({
    autoInitialize: true,
    onSessionWarning: (warning) => {
      // Custom warning handling if needed
      console.log("Session warning:", warning);
    },
    onSessionEnd: () => {
      // Called when session ends
      console.log("Session ended");
    },
  });

  // Only show dialog if user is authenticated
  if (!user) return null;

  return (
    <SessionWarningDialog
      warning={warningDetails}
      isOpen={showExpiryWarning}
      onExtend={extendSession}
      onLogout={logout}
    />
  );
}

/**
 * Example Integration in App.tsx:
 * 
 * import { BrowserRouter, Routes, Route } from "react-router-dom";
 * import { SessionInitializer } from "@/components/auth/SessionInitializer";
 * import { useAuth } from "@/hooks/useAuth";
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <AuthProvider>
 *         <SessionInitializer />
 *         <Routes>
 *           <Route path="/" element={<Home />} />
 *           <Route path="/account/sessions" element={<AccountPage />} />
 *           {/* ... other routes ... */}
 *         </Routes>
 *       </AuthProvider>
 *     </BrowserRouter>
 *   );
 * }
 * 
 * export default App;
 */

/**
 * Example Account Settings Page with Session Manager
 */
export function AccountSettingsPage() {
  // Use this in your account page to show session management UI
  const { SessionManager } = require("@/components/auth/SessionManager");

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and security settings
          </p>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          {/* Session Management Tab */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
            <SessionManager />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Manual Integration Steps:
 * 
 * 1. Import in App.tsx:
 *    import { SessionInitializer } from "@/components/auth/SessionInitializer";
 * 
 * 2. Add to your layout (after auth setup):
 *    <SessionInitializer />
 * 
 * 3. Update your account/settings route pages:
 *    import { SessionManager } from "@/components/auth/SessionManager";
 *    
 *    <Routes>
 *      <Route path="/account/sessions" element={<SessionManager />} />
 *    </Routes>
 * 
 * 4. Verify logging - check browser console for session events
 * 
 * 5. Test:
 *    - Leave browser idle for 30+ minutes → should see inactivity warning
 *    - Stay logged in for 24 hours → should see expiration warning
 *    - Try from multiple devices → should see device tracking
 */
