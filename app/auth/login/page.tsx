"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/browserClient";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import Card from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("passwordUpdated") === "true") {
      setSuccess("Password updated successfully! You can now log in with your new password.");
    }
    
    // Check if already authenticated and redirect
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <AuthCard
        title="Log in"
        description="Sign in to your DoppleCart account"
        footerText="Don't have an account?"
        footerLinkText="Create an account"
        footerLinkHref="/auth/register"
      >
        {error && (
          <div className="p-3 rounded-sm bg-danger/10 border border-danger/20">
            <p className="text-body-s text-danger">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-sm bg-success/10 border border-success/20">
            <p className="text-body-s text-success">{success}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register("email")}
            label="Email"
            type="email"
            placeholder="you@example.com"
            variant="border"
            error={!!errors.email}
            errorMessage={errors.email?.message}
            disabled={isLoading}
          />
          <Input
            {...register("password")}
            label="Password"
            type="password"
            placeholder="Enter your password"
            variant="border"
            error={!!errors.password}
            errorMessage={errors.password?.message}
            disabled={isLoading}
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? "Signing in..." : "Log in"}
          </Button>
        </form>

        <GoogleAuthButton isLoading={isLoading} onClick={handleGoogleLogin} />

        <div className="mt-2 text-center">
          <Link
            href="/auth/reset-password"
            className="block text-body-m text-primary hover:underline transition-motion"
          >
            Forgot your password?
          </Link>
        </div>
      </AuthCard>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
        <div className="z-10 max-w-md w-full">
          <h1 className="text-h2 text-center mb-8">Log in</h1>
          <Card variant="elevated" padding="lg">
            <CardContent className="text-center">
              <p className="text-body-m text-text-secondary">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
