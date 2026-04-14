/**
 * SessionManager - Component to view and manage active sessions across devices
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Laptop, Smartphone, Trash2, LogOut } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SessionInfo } from "@/services/SessionManagementService";
import { useSessionManager } from "@/hooks/useSessionManager";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function SessionManager() {
  const {
    sessionInfo,
    activeSessions,
    getActiveSessions,
    revokeSession,
    logout,
  } = useSessionManager({ autoInitialize: false });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      await getActiveSessions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!selectedSession) return;

    try {
      await revokeSession(selectedSession.sessionId);
      setShowRevokeDialog(false);
      setSelectedSession(null);
    } catch (error) {
      console.error("Error revoking session:", error);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm("Are you sure you want to logout from all devices?")) {
      await logout();
    }
  };

  const getDeviceIcon = (isMobile: boolean) => {
    return isMobile ? (
      <Smartphone className="h-5 w-5" />
    ) : (
      <Laptop className="h-5 w-5" />
    );
  };

  const isCurrentSession = (session: SessionInfo) => {
    return session.sessionId === sessionInfo?.sessionId;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Please wait while we load your sessions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Alert */}
      {activeSessions.length > 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Multiple Active Sessions</AlertTitle>
          <AlertDescription>
            You are logged in on {activeSessions.length} devices. For security,
            review and logout from devices you don't recognize.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((session) => {
                const isCurrent = isCurrentSession(session);
                
                return (
                  <div
                    key={session.sessionId}
                    className={`flex items-start justify-between p-4 rounded-lg border ${
                      isCurrent ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getDeviceIcon(session.deviceInfo.isMobile)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {session.deviceInfo.deviceName}
                          </h4>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              This device
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1 mt-1">
                          <p className="truncate">
                            {session.ipAddress || "IP unknown"}
                          </p>
                          <p>
                            Signed in{" "}
                            {format(session.createdAt, "PPpp", {
                              locale: idLocale,
                            })}
                          </p>
                          <p>
                            Last active{" "}
                            {format(session.lastActivityAt, "PPpp", {
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSelectedSession(session);
                          setShowRevokeDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Session Security</CardTitle>
          <CardDescription>
            Manage your session security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Auto-logout Timeout</p>
                <p className="text-xs text-muted-foreground">
                  Automatically logout after 30 minutes of inactivity
                </p>
              </div>
              <Badge variant="outline">30 min</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Session Duration</p>
                <p className="text-xs text-muted-foreground">
                  Sessions expire after 24 hours of creation
                </p>
              </div>
              <Badge variant="outline">24 hrs</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Token Refresh</p>
                <p className="text-xs text-muted-foreground">
                  Authentication token refreshed automatically every 50 minutes
                </p>
              </div>
              <Badge variant="outline">50 min</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Options */}
      <Card>
        <CardHeader>
          <CardTitle>Logout Options</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogoutAll}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout from All Devices
          </Button>
        </CardContent>
      </Card>

      {/* Revoke Session Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout from This Device?</DialogTitle>
            <DialogDescription>
              You will be logged out from{" "}
              <span className="font-medium">
                {selectedSession?.deviceInfo.deviceName}
              </span>
              . Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeSession}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
