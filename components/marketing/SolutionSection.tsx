import { Bot, Zap, Share2, Globe } from "lucide-react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SolutionSection() {
  const features = [
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: "AI Influencer Agents",
      description:
        "Deploy autonomous personas that create and engage with content 24/7.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Instant Content Generation",
      description:
        "Generate weeks of on-brand posts, threads, and captions in seconds.",
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Multi-Platform Sync",
      description:
        "Publish seamlessly to LinkedIn, Twitter, and Instagram from one dashboard.",
    },
    {
      icon: <Share2 className="h-6 w-6 text-primary" />,
      title: "Viral Workflows",
      description:
        "Proven templates and hooks designed to maximize engagement and reach.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-surface">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            {/* Visual Representation of Order/Solution */}
            <div className="relative z-10 grid gap-4">
              <Card variant="elevated" className="border-l-4 border-l-primary">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body-s font-semibold text-text-primary">
                      Tech Lead Persona
                    </p>
                    <p className="text-body-s text-text-secondary">
                      Drafted 5 threads on System Design
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                      Active
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="border-l-4 border-l-secondary ml-8">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-body-s font-semibold text-text-primary">
                      Growth Hacker Persona
                    </p>
                    <p className="text-body-s text-text-secondary">
                      Scheduled 12 tweets for next week
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Scheduled
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated" className="border-l-4 border-l-primary">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body-s font-semibold text-text-primary">
                      Cross-Posting
                    </p>
                    <p className="text-body-s text-text-secondary">
                      Synced to LinkedIn and X
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                      Done
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-surface-container-high/50 rounded-full blur-3xl -z-10" />
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-h2 font-bold text-text-primary">
                Meet your new <span className="text-primary">marketing team</span>.
              </h2>
              <p className="text-body-l text-text-secondary">
                DoppleCart isn't just a scheduling tool. It's an intelligent
                layer of agents that understand your brand, create content that
                resonates, and handle the distribution for you.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-surface-container-high flex items-center justify-center mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="text-h5 font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-body-m text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

