import Link from "next/link";
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <div className="z-10 max-w-md w-full">
        <h1 className="text-h2 text-center mb-8">Login</h1>
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your DoppleCart account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              variant="border"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              variant="border"
            />
            <Button fullWidth size="lg" className="mt-4">
              Sign In
            </Button>
            <p className="text-body-s text-text-tertiary text-center mt-4">
              This will use Supabase Auth with email magic links.
            </p>
          </CardContent>
        </Card>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-body-m text-primary hover:underline transition-motion"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

