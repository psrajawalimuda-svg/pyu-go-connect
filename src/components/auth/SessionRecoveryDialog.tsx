/**
 * SessionRecoveryDialog - Secure password verification for session recovery
 * Allows user to regain access without losing context
 */

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface SessionRecoveryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SessionRecoveryDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  onError,
}: SessionRecoveryDialogProps) {
  const { user } = useAuthStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"verify" | "success">("verify");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError("User information not found. Please login again.");
      onError?.("User information not found");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    if (isLocked) {
      setError("Too many attempts. Please try again in a few minutes.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Attempt to reauthenticate with email and password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        // Handle wrong password
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setError(
            `Too many failed attempts. Please try again in 5 minutes or reset your password.`
          );
          onError?.(
            "Account locked. Please try again later or reset your password."
          );

          // Auto-unlock after lockout duration
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
          }, LOCKOUT_DURATION);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(
            `Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          );
          onError?.("Incorrect password");
        }
        return;
      }

      // Success - refresh token and show success state
      const { data, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !data.session) {
        setError("Failed to refresh session. Please login again.");
        onError?.(refreshError?.message || "Session refresh failed");
        return;
      }

      // Reset form
      setPassword("");
      setAttempts(0);
      setStep("success");

      toast.success("Session recovered successfully! Redirecting...");

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setStep("verify");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) throw error;

      toast.success("Password reset link sent to your email");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setPassword("");
      setError("");
      setStep("verify");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur border-white/20">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Recover Your Session</DialogTitle>
              <DialogDescription className="mt-1">
                {step === "verify"
                  ? "Please verify your password to recover your session"
                  : "Your session has been recovered successfully"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "verify" ? (
          <form onSubmit={handleRecover} className="space-y-4">
            {/* User Email Display */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">{user?.email}</span>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-slate-900">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  disabled={isLoading || isLocked}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isLocked}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                For your security, we need to verify your identity. Your password is only used to authenticate and is not stored.
              </p>
            </div>

            {/* Attempt Counter */}
            {attempts > 0 && (
              <div className="text-xs text-slate-500 text-center">
                {attempts}/{MAX_ATTEMPTS} attempts used
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading || isLocked || !password.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading ? "Verifying..." : "Recover Session"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="w-full text-slate-700"
              >
                Forgot Password?
              </Button>
            </div>
          </form>
        ) : (
          // Success State
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-green-500 rounded-full p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-semibold text-slate-900">
                Session Recovered!
              </h3>
              <p className="text-sm text-slate-600">
                Your session has been restored. You will be redirected shortly.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800 text-center">
                ✓ Session verified and tokens refreshed
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
