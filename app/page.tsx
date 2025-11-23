import Link from "next/link";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-surface">
      <div className="z-10 max-w-5xl w-full text-center">
        <h1 className="text-h1 mb-4">DoppleCart</h1>
        <p className="text-body-l text-text-secondary mb-8">
          Push a cart full of AI influencers
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link href="/design-system">
            <Button variant="outline" size="lg">
              Design System
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

