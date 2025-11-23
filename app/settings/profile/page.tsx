import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import ProfileSettingsClient from "./ProfileSettingsClient";

export default async function ProfileSettingsPage() {
  const user = await getServerUser();
  const supabase = await createSupabaseServerClient();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user metadata
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Check which providers are linked
  const providers: string[] = [];
  if (authUser?.email) {
    providers.push("email");
  }

  // Check if user has Google provider (simplified check)
  // In production, you'd check identities properly
  const hasGoogleProvider = authUser?.app_metadata?.provider === "google";

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-h2 text-text-primary">Profile Settings</h1>
        <p className="text-body-m text-text-secondary mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <ProfileSettingsClient
        initialProfile={profile}
        userEmail={user.email || ""}
        userCreatedAt={user.created_at}
        emailVerified={authUser?.email_confirmed_at ? true : false}
        providers={hasGoogleProvider ? [...providers, "google"] : providers}
      />
    </div>
  );
}

