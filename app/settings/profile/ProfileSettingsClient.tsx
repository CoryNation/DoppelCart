"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/browserClient";
import { updateProfile, updatePassword } from "@/app/actions/profile";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

const profileSchema = z.object({
  full_name: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface Profile {
  full_name?: string;
  company?: string;
  role?: string;
}

interface ProfileSettingsClientProps {
  initialProfile: Profile | null;
  userEmail: string;
  userCreatedAt: string;
  emailVerified: boolean;
  providers: string[];
}

export default function ProfileSettingsClient({
  initialProfile,
  userEmail,
  userCreatedAt,
  emailVerified,
  providers,
}: ProfileSettingsClientProps) {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile?.full_name || "",
      company: initialProfile?.company || "",
      role: initialProfile?.role || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile(data);
      setProfileSuccess(true);
      router.refresh();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await updatePassword(data.password);
      setPasswordSuccess(true);
      resetPasswordForm();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update password";
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
        },
      });

      if (error) {
        setProfileError(error.message);
      }
    } catch {
      setProfileError("Failed to connect Google account");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-body-s font-medium text-text-secondary">
              Email
            </label>
            <p className="text-body-m text-text-primary mt-1">{userEmail}</p>
            {emailVerified ? (
              <Badge variant="success" size="sm" className="mt-2">
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="mt-2">
                Not verified
              </Badge>
            )}
          </div>
          <div>
            <label className="text-body-s font-medium text-text-secondary">
              Account created
            </label>
            <p className="text-body-m text-text-primary mt-1">
              {formatDate(userCreatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileError && (
            <div className="p-3 rounded-sm bg-danger/10 border border-danger/20">
              <p className="text-body-s text-danger">{profileError}</p>
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 rounded-sm bg-success/10 border border-success/20">
              <p className="text-body-s text-success">
                Profile updated successfully!
              </p>
            </div>
          )}
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              {...registerProfile("full_name")}
              label="Full Name"
              type="text"
              placeholder="Your full name"
              variant="border"
              error={!!profileErrors.full_name}
              errorMessage={profileErrors.full_name?.message}
              disabled={profileLoading}
            />
            <Input
              {...registerProfile("company")}
              label="Company"
              type="text"
              placeholder="Your company"
              variant="border"
              error={!!profileErrors.company}
              errorMessage={profileErrors.company?.message}
              disabled={profileLoading}
            />
            <Input
              {...registerProfile("role")}
              label="Role"
              type="text"
              placeholder="Your role"
              variant="border"
              error={!!profileErrors.role}
              errorMessage={profileErrors.role?.message}
              disabled={profileLoading}
            />
            <Button
              type="submit"
              disabled={profileLoading}
              className="mt-4"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      {providers.includes("email") && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-sm bg-danger/10 border border-danger/20">
                <p className="text-body-s text-danger">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-sm bg-success/10 border border-success/20">
                <p className="text-body-s text-success">
                  Password updated successfully!
                </p>
              </div>
            )}
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <Input
                {...registerPassword("password")}
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                variant="border"
                error={!!passwordErrors.password}
                errorMessage={passwordErrors.password?.message}
                disabled={passwordLoading}
              />
              <Input
                {...registerPassword("confirmPassword")}
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your password"
                variant="border"
                error={!!passwordErrors.confirmPassword}
                errorMessage={passwordErrors.confirmPassword?.message}
                disabled={passwordLoading}
              />
              <Button
                type="submit"
                disabled={passwordLoading}
                className="mt-4"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage your authentication methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-sm">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-body-m font-medium text-text-primary">
                  Google
                </p>
                <p className="text-body-s text-text-secondary">
                  {providers.includes("google")
                    ? "Connected to your account"
                    : "Not connected"}
                </p>
              </div>
            </div>
            {providers.includes("google") ? (
              <Badge variant="success" size="sm">
                Connected
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoogleConnect}
              >
                Connect Google
              </Button>
            )}
          </div>
          <p className="text-body-s text-text-tertiary">
            {providers.includes("google")
              ? "You can sign in using your Google account. Disconnecting Google is not available at this time."
              : "Connect your Google account to sign in with Google."}
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card variant="outlined" padding="lg">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-danger/20 rounded-sm bg-danger/5">
            <p className="text-body-m text-text-primary mb-4">
              Delete your account
            </p>
            <p className="text-body-s text-text-secondary mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button variant="outline" size="md" disabled>
              Delete Account
            </Button>
            <p className="text-body-s text-text-tertiary mt-2">
              Account deletion is not yet implemented. Contact support for
              assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

