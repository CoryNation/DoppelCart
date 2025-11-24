"use server";

import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getServerUser } from "@/lib/auth/getServerUser";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { redirect } from "next/navigation";

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
  await getServerUser(); // Verify user is authenticated
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

/**
 * Delete the current user's account
 */
export async function deleteAccount() {
  const user = await getServerUser();
  const supabaseAdmin = createSupabaseServiceClient();

  // Delete the user from Supabase Auth
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }

  // Sign out the user to clear session
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/");
}


