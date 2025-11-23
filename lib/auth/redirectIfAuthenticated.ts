import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { redirect } from "next/navigation";

/**
 * Redirect authenticated users away from auth pages (login, register, etc.)
 * to the dashboard.
 */
export async function redirectIfAuthenticated() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
}

