import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user on the server side.
 * Redirects to /auth/login if not authenticated.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * Get the current authenticated user on the server side.
 * Returns null if not authenticated (does not redirect).
 */
export async function getServerUserOptional() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

