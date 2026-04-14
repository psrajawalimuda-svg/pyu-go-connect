/**
 * SessionWarningDialog - Component to warn users about session expiration
 */

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Clock } from "lucide-react";
import type { SessionWarning } from "@/services/SessionManagementService";

interface SessionWarningDialogProps {
  warning: SessionWarning | null;
  isOpen: boolean;
  onExtend: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function SessionWarningDialog({
  warning,
  isOpen,
  onExtend,
  onLogout,
}: SessionWarningDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Count down timer
  useEffect(() => {
    if (!warning || warning.type !== "INACTIVITY_WARNING") return;

    setTimeLeft(5); // 5 minutes
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onLogout();
          return null;
        }
        return prev - 1;
      });
    }, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [warning, onLogout]);

  if (!warning || !isOpen) return null;

  const handleExtend = async () => {
    setIsLoading(true);
    try {
      await onExtend();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await onLogout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {warning.type === "INACTIVITY_WARNING" ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <AlertDialogTitle>
              {warning.type === "EXPIRING_SOON"
                ? "Session Expiring Soon"
                : warning.type === "INACTIVITY_WARNING"
                ? "Session Inactive"
                : "Security Alert"}
            </AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-3">
          <p>{warning.message}</p>

          {warning.type === "INACTIVITY_WARNING" && timeLeft !== null && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
              Automatic logout in {timeLeft} {timeLeft === 1 ? "minute" : "minutes"}
            </div>
          )}

          {warning.type === "SUSPICIOUS_LOGIN" && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              <p className="font-semibold mb-1">Suspicious Activity Detected</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Login from a new device or location detected</li>
                <li>If this wasn't you, please change your password immediately</li>
              </ul>
            </div>
          )}
        </AlertDialogDescription>

        <AlertDialogFooter>
          {warning.type !== "SUSPICIOUS_LOGIN" && (
            <AlertDialogCancel
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Logout
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleExtend}
            disabled={isLoading}
            className={
              warning.type === "SUSPICIOUS_LOGIN"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {isLoading
              ? "Processing..."
              : warning.type === "SUSPICIOUS_LOGIN"
              ? "Change Password"
              : "Continue Session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
