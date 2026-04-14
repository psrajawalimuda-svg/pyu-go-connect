/**
 * SessionExpiredPage - Beautiful page displayed when session expires
 * Allows user to recover session with password or logout
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Lock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SessionRecoveryDialog } from "./SessionRecoveryDialog";

interface SessionExpiredPageProps {
  expiryTime?: Date;
  autoRedirectSeconds?: number;
  onRecover?: () => void;
  onLogout?: () => void;
}

export function SessionExpiredPage({
  expiryTime,
  autoRedirectSeconds = 60,
  onRecover,
  onLogout,
}: SessionExpiredPageProps) {
  const navigate = useNavigate();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(autoRedirectSeconds);

  // Auto-redirect countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/auth");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    onLogout?.();
    navigate("/auth");
  };

  const handleRecover = () => {
    setShowRecoveryDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background animation elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur border-white/20 shadow-2xl">
          <div className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Session Expired
              </h1>
              <p className="text-slate-600">
                Your session has expired for security reasons
              </p>
            </div>

            {/* Expiry Time */}
            {expiryTime && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-600 font-medium">
                  Expired at:{" "}
                  <span className="font-mono text-slate-900">
                    {expiryTime.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </p>
              </div>
            )}

            {/* Reasons */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Why did this happen?
              </h3>
              <ul className="text-xs text-blue-800 space-y-1 text-left">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Your session has been inactive for more than 30 minutes</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>You logged in more than 24 hours ago</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>You were logged out from another device</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRecover}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg font-semibold py-6"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Recover Session
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Login Again
              </Button>
            </div>

            {/* Auto-redirect Info */}
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                You will be redirected to login in{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {secondsLeft}
                </span>{" "}
                seconds
              </p>
              <p>Click a button above to proceed immediately</p>
            </div>

            {/* Security Note */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex gap-2 items-start">
                <Lock className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 text-left">
                  For your security, please verify your password to recover your session
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>
            Need help?{" "}
            <a
              href="/support"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>

      {/* Recovery Dialog */}
      <SessionRecoveryDialog
        isOpen={showRecoveryDialog}
        onOpenChange={setShowRecoveryDialog}
        onSuccess={onRecover}
      />
    </div>
  );
}
