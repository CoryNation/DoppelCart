"use client";

import { useState } from "react";
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

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        }
      );

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <div className="z-10 max-w-md w-full">
        <h1 className="text-h2 text-center mb-8">Reset password</h1>
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-sm bg-danger/10 border border-danger/20">
                <p className="text-body-s text-danger">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-sm bg-success/10 border border-success/20">
                <p className="text-body-s text-success">
                  Password reset link sent! Please check your email for
                  instructions.
                </p>
              </div>
            )}
            {!success && (
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
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
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

