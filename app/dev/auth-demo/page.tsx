import { redirect } from "next/navigation";
import { getServerUserOptional } from "@/lib/auth/getServerUser";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import Link from "next/link";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default async function AuthDemoPage() {
  const user = await getServerUserOptional();
  const supabase = await createSupabaseServerClient();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-h2 mb-6">Auth Demo</h1>

      {user ? (
        <div className="space-y-6">
          <Card variant="elevated" padding="lg">
            <CardHeader>
              <CardTitle>You are logged in</CardTitle>
              <CardDescription>
                Here's your current authentication status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-body-s font-medium text-text-secondary">
                  User ID
                </label>
                <p className="text-body-m text-text-primary mt-1 font-mono text-sm">
                  {user.id}
                </p>
              </div>
              <div>
                <label className="text-body-s font-medium text-text-secondary">
                  Email
                </label>
                <p className="text-body-m text-text-primary mt-1">
                  {user.email}
                </p>
              </div>
              <div>
                <label className="text-body-s font-medium text-text-secondary">
                  Email Verified
                </label>
                <div className="mt-1">
                  {user.email_confirmed_at ? (
                    <Badge variant="success" size="sm">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Not verified
                    </Badge>
                  )}
                </div>
              </div>
              {profile && (
                <div>
                  <label className="text-body-s font-medium text-text-secondary">
                    Profile Name
                  </label>
                  <p className="text-body-m text-text-primary mt-1">
                    {profile.full_name || "Not set"}
                  </p>
                </div>
              )}
              <div>
                <label className="text-body-s font-medium text-text-secondary">
                  Account Created
                </label>
                <p className="text-body-m text-text-primary mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link href="/settings/profile">
              <Button>Go to Profile Settings</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      ) : (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>You are not logged in</CardTitle>
            <CardDescription>
              Sign in to see your authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button fullWidth>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

