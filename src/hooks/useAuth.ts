import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Role } from "@/lib/rbac";

export function useAuth() {
  const { setSession, setLoading, setRole, user, session, isLoading, isGuest, role, permissions } = useAuthStore();

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error || !data) {
      setRole("user"); // Default role
    } else {
      setRole(data.role as Role);
    }
  }, [setRole]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading, setRole, fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, options?: { phone?: string; license_number?: string; isDriver?: boolean }) => {
    // Validasi duplikasi driver sebelum signup
    if (options?.isDriver) {
      if (options.phone) {
        const { data: existingPhone } = await supabase
          .from("drivers")
          .select("id")
          .eq("phone", options.phone)
          .maybeSingle();
        if (existingPhone) {
          return { error: new Error("Nomor telepon sudah terdaftar sebagai driver.") };
        }
      }
      if (options.license_number) {
        const { data: existingLicense } = await supabase
          .from("drivers")
          .select("id")
          .eq("license_number", options.license_number)
          .maybeSingle();
        if (existingLicense) {
          return { error: new Error("Nomor SIM sudah terdaftar.") };
        }
      }
    }

    // Signup — handle_new_user trigger creates profile, role, and driver record automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: options?.phone,
          license_number: options?.license_number,
          is_driver: options?.isDriver || false,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
  };

  return { user, session, isLoading, isGuest, role, permissions, signIn, signUp, signOut };
}
