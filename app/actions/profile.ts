"use server";

import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getServerUser } from "@/lib/auth/getServerUser";
import { revalidatePath } from "next/cache";

export interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  company?: string;
  role?: string;
}

/**
 * Get the current user's profile
 */
export async function getProfile() {
  const user = await getServerUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" - we'll create the profile if it doesn't exist
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(data: ProfileData) {
  const user = await getServerUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath("/settings/profile");
}

/**
 * Update the user's password
 */
export async function updatePassword(newPassword: string) {
  const user = await getServerUser();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }
}


