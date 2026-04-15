/**
 * Auth Middleware: JWT Validation & Session Management
 * PHASE 1 CRITICAL FIX #2
 * 
 * Purpose: Validate JWT tokens on all protected endpoints
 * Security: Prevents unauthorized access to APIs
 * 
 * Note: This is a client-side project. This middleware is kept as reference
 * for future server-side implementation. It is not actively used.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Extract token from Authorization header string
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Verify a token by calling Supabase getUser
 */
export async function verifyToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'user'
  };
}

/**
 * Check if a JWT is expired by decoding its payload
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}
