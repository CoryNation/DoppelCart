"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/browserClient";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess(
        "Account created! Please check your email to verify your account before signing in."
      );
      setIsLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <AuthCard
        title="Create account"
        description="Create a new DoppleCart account"
        footerText="Already have an account?"
        footerLinkText="Log in"
        footerLinkHref="/auth/login"
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
            placeholder="At least 6 characters"
            variant="border"
            error={!!errors.password}
            errorMessage={errors.password?.message}
            disabled={isLoading}
          />
          <Input
            {...register("confirmPassword")}
            label="Confirm Password"
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <GoogleAuthButton
          isLoading={isLoading}
          onClick={handleGoogleSignup}
          text="Continue with Google"
        />
      </AuthCard>
    </main>
  );
}
