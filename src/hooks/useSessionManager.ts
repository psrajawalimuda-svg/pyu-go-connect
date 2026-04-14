/**
 * useSessionManager - React hook for session management
 * Integrates session monitoring with React components
 */

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionManagement, type SessionWarning, type SessionInfo } from "@/services/SessionManagementService";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface UseSessionManagerOptions {
  autoInitialize?: boolean;
  onSessionWarning?: (warning: SessionWarning) => void;
  onSessionEnd?: () => void;
}

export function useSessionManager(options: UseSessionManagerOptions = {}) {
  const { autoInitialize = true, onSessionWarning, onSessionEnd } = options;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [warningDetails, setWarningDetails] = useState<SessionWarning | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [sessionExpiredTime, setSessionExpiredTime] = useState<Date | null>(null);

  /**
   * Handle session warning
   */
  const handleSessionWarning = useCallback(
    (warning: SessionWarning) => {
      setShowExpiryWarning(true);
      setWarningDetails(warning);

      // Show toast notification
      switch (warning.type) {
        case "EXPIRING_SOON":
          toast.warning(warning.message, {
            duration: 10000,
            action: {
              label: "Extend Session",
              onClick: () => handleExtendSession(),
            },
          });
          break;
        
        case "INACTIVITY_WARNING":
          toast.warning(warning.message, {
            duration: 15000,
            action: {
              label: "Continue",
              onClick: () => handleContinueSession(),
            },
          });
          break;
        
        case "SUSPICIOUS_LOGIN":
          toast.error(warning.message, {
            duration: 10000,
            dismissible: true,
          });
          break;
        
        case "NEW_DEVICE":
          toast.info(warning.message, {
            duration: 10000,
            action: {
              label: "View Sessions",
              onClick: () => navigate("/account/sessions"),
            },
          });
          break;
      }

      // Call custom handler
      onSessionWarning?.(warning);
    },
    [onSessionWarning, navigate]
  );

  /**
   * Extend current session
   */
  const handleExtendSession = useCallback(async () => {
    try {
      const success = await sessionManagement.extendSession();
      
      if (success) {
        setShowExpiryWarning(false);
        setWarningDetails(null);
        toast.success("Session extended for 24 hours");
      } else {
        toast.error("Failed to extend session. Please log in again.");
        await handleLogout();
      }
    } catch (error) {
      console.error("Error extending session:", error);
      toast.error("An error occurred while extending your session");
    }
  }, []);

  /**
   * Continue session (dismiss inactivity warning)
   */
  const handleContinueSession = useCallback(() => {
    setShowExpiryWarning(false);
    setWarningDetails(null);
    toast.success("Session continued");
  }, []);

  /**
   * Handle session expiration
   */
  const handleSessionExpired = useCallback(() => {
    setIsSessionExpired(true);
    setSessionExpiredTime(new Date());
    setShowExpiryWarning(false);
    setIsSessionValid(false);
  }, []);

  /**
   * Logout (define first - no dependencies except primitives)
   */
  const handleLogout = useCallback(async () => {
    try {
      await sessionManagement.logout();
      setSessionInfo(null);
      setIsSessionValid(false);
      setShowExpiryWarning(false);
      setIsSessionExpired(false);
      onSessionEnd?.();
      navigate("/auth", { replace: true });
      toast.success("You have been logged out");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error logging out");
    }
  }, [navigate, onSessionEnd]);

  /**
   * Get active sessions (define early - no dependencies)
   */
  const getActiveSessions = useCallback(async () => {
    try {
      const sessions = await sessionManagement.getActiveSessions();
      setActiveSessions(sessions);
      return sessions;
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      return [];
    }
  }, []);

  /**
   * Validate session (now handleLogout is defined)
   */
  const validateSession = useCallback(async () => {
    try {
      const isValid = await sessionManagement.validateSession();
      setIsSessionValid(isValid);
      
      if (!isValid) {
        toast.error("Your session is no longer valid. Please log in again.");
        await handleLogout();
      }
      
      return isValid;
    } catch (error) {
      console.error("Error validating session:", error);
      setIsSessionValid(false);
      return false;
    }
  }, [handleLogout]);

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async () => {
    try {
      const success = await sessionManagement.refreshToken();
      
      if (!success) {
        toast.error("Token refresh failed. Please log in again.");
        await handleLogout();
      }
      
      return success;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, [handleLogout]);

  /**
   * Recover expired session (now validateSession and getActiveSessions are defined)
   */
  const recoverSession = useCallback(async () => {
    try {
      // Validate session after recovery
      const isValid = await validateSession();
      
      if (isValid) {
        setIsSessionExpired(false);
        setSessionExpiredTime(null);
        setShowExpiryWarning(false);
        
        // Reload active sessions
        await getActiveSessions();
        
        toast.success("Session recovered successfully");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error recovering session:", error);
      toast.error("Failed to recover session");
      return false;
    }
  }, [validateSession, getActiveSessions]);

  /**
   * Revoke session (logout from other device)
   */
  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const success = await sessionManagement.revokeSession(sessionId);
      
      if (success) {
        toast.success("Session revoked successfully");
        await getActiveSessions();
      } else {
        toast.error("Failed to revoke session");
      }
      
      return success;
    } catch (error) {
      console.error("Error revoking session:", error);
      toast.error("An error occurred while revoking the session");
      return false;
    }
  }, [getActiveSessions]);

  /**
   * Initialize session management
   */
  useEffect(() => {
    if (!autoInitialize || !user) return;

    let mounted = true;

    const initSession = async () => {
      try {
        const session = await sessionManagement.initializeSession(handleSessionWarning);
        
        if (mounted && session) {
          setSessionInfo(session);
          setIsSessionValid(true);
          
          // Load active sessions
          await getActiveSessions();
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        if (mounted) {
          setIsSessionValid(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      sessionManagement.destroy();
    };
  }, [user, autoInitialize, handleSessionWarning, getActiveSessions]);

  return {
    // State
    sessionInfo,
    activeSessions,
    isSessionValid,
    showExpiryWarning,
    warningDetails,
    isSessionExpired,
    sessionExpiredTime,
    
    // Actions
    extendSession: handleExtendSession,
    continueSession: handleContinueSession,
    logout: handleLogout,
    validateSession,
    refreshToken,
    getActiveSessions,
    revokeSession,
    recoverSession,
    handleSessionExpired,
  };
}
