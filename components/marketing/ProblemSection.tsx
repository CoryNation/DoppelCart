import { XCircle, Clock, BarChart3, Layers } from "lucide-react";
import Card, { CardContent } from "@/components/ui/card";

export default function ProblemSection() {
  const painPoints = [
    {
      icon: <Clock className="h-6 w-6 text-secondary" />,
      title: "Time Drain",
      description:
        "Spending hours crafting posts instead of building your product.",
    },
    {
      icon: <Layers className="h-6 w-6 text-secondary" />,
      title: "Platform Fatigue",
      description:
        "Switching between LinkedIn, Twitter, and Instagram breaks your flow.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-secondary" />,
      title: "Inconsistent Growth",
      description:
        "Algorithmic changes kill your reach when you take a break.",
    },
    {
      icon: <XCircle className="h-6 w-6 text-secondary" />,
      title: "Creative Block",
      description: "Staring at a blank screen wondering what to post next.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-surface-container-high/30">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-h2 font-bold text-text-primary">
                Social media management is{" "}
                <span className="text-secondary">broken</span>.
              </h2>
              <p className="text-body-l text-text-secondary">
                The modern entrepreneur is expected to be a full-time creator,
                writer, and community manager. It's an impossible standard that
                leads to burnout and neglected products.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {painPoints.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">{point.icon}</div>
                  <div>
                    <h3 className="text-body-l font-semibold text-text-primary">
                      {point.title}
                    </h3>
                    <p className="text-body-s text-text-secondary mt-1">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Visual Representation of Chaos/Overwhelm */}
            <div className="relative grid grid-cols-2 gap-4 opacity-90">
              <Card variant="outlined" className="rotate-[-2deg] translate-y-8">
                <CardContent className="p-6">
                  <div className="h-2 w-20 bg-text-disabled rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-surface-container-highest rounded" />
                    <div className="h-2 w-3/4 bg-surface-container-highest rounded" />
                  </div>
                </CardContent>
              </Card>
              <Card variant="outlined" className="rotate-[3deg]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-danger/10" />
                    <div className="h-2 w-16 bg-text-disabled rounded" />
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded" />
                </CardContent>
              </Card>
              <Card variant="outlined" className="rotate-[1deg] translate-y-4">
                <CardContent className="p-6">
                  <div className="h-20 w-full bg-surface-container-highest rounded mb-4" />
                  <div className="h-2 w-1/2 bg-text-disabled rounded" />
                </CardContent>
              </Card>
              <Card variant="outlined" className="rotate-[-4deg] -translate-y-4">
                <CardContent className="p-6 flex items-center justify-center h-full min-h-[140px]">
                  <span className="text-h1 text-text-disabled">?</span>
                </CardContent>
              </Card>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 lg:hidden" />
          </div>
        </div>
      </div>
    </section>
  );
}

