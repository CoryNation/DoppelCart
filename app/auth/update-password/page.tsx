"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/browserClient";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  useEffect(() => {
    // Check if user is authenticated (from password reset link)
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Redirect to login with success message
      router.push("/auth/login?passwordUpdated=true");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
        <div className="z-10 max-w-md w-full">
          <Card variant="elevated" padding="lg">
            <CardContent className="text-center">
              <p className="text-body-m text-text-secondary mb-4">
                Please use the password reset link from your email to access
                this page.
              </p>
              <Link
                href="/auth/reset-password"
                className="text-body-m text-primary hover:underline transition-motion"
              >
                Request a new reset link
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <div className="z-10 max-w-md w-full">
        <h1 className="text-h2 text-center mb-8">Update password</h1>
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's at least 6
              characters long.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-sm bg-danger/10 border border-danger/20">
                <p className="text-body-s text-danger">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register("password")}
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                variant="border"
                error={!!errors.password}
                errorMessage={errors.password?.message}
                disabled={isLoading}
              />
              <Input
                {...register("confirmPassword")}
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your password"
                variant="border"
                error={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
                disabled={isLoading}
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isLoading}
                className="mt-4"
              >
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-body-m text-primary hover:underline transition-motion"
              >
                ← Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

