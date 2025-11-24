import Link from "next/link";
import Button from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary text-text-on-primary">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <h2 className="text-h2 md:text-5xl font-bold mb-6 text-text-on-primary">
          Ready to automate your influence?
        </h2>
        <p className="text-body-l md:text-xl text-text-on-primary/90 max-w-2xl mx-auto mb-10">
          Join thousands of creators using DoppelCart to build their audience
          while they sleep. Start your free trial today.
        </p>
        <Link href="/auth/register">
          <Button
            size="lg"
            className="h-14 px-8 text-lg bg-surface text-primary hover:bg-surface-container shadow-lg border-2 border-transparent hover:border-surface-container-high"
          >
            Get Started – It’s Free
          </Button>
        </Link>
        <p className="text-body-s text-text-on-primary/70 mt-4">
          No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
}

