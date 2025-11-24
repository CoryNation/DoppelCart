import Link from "next/link";
import Button from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { BackgroundGlow } from "./BackgroundGlow";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-border bg-surface-container px-3 py-1 text-sm text-text-secondary animate-fade-in-up">
            <Sparkles className="mr-2 h-4 w-4 text-secondary" />
            <span className="text-body-s font-medium">
              Introducing Autonomous Influencer Agents
            </span>
          </div>

          <h1 className="text-h1 md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary">
            Automate your social presence with{" "}
            <span className="text-primary">unencumbered efficiency</span>
          </h1>

          <p className="text-body-l md:text-xl text-text-secondary max-w-2xl mx-auto">
            Stop juggling platforms and fighting algorithms. DoppelCart deploys
            AI agents to manage, create, and grow your audience while you focus on
            building your business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" fullWidth className="h-12 px-8">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth className="h-12 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <BackgroundGlow />
    </section>
  );
}

