import { UserPlus, Settings2, PlayCircle, BarChart } from "lucide-react";

export default function PlanSection() {
  const steps = [
    {
      number: "01",
      icon: <UserPlus className="h-6 w-6 text-primary" />,
      title: "Create Account",
      description: "Sign up in seconds via Google or email.",
    },
    {
      number: "02",
      icon: <Settings2 className="h-6 w-6 text-primary" />,
      title: "Define Brand",
      description: "Tell the AI about your product and goals.",
    },
    {
      number: "03",
      icon: <PlayCircle className="h-6 w-6 text-primary" />,
      title: "Launch Agents",
      description: "Activate personas to start creating.",
    },
    {
      number: "04",
      icon: <BarChart className="h-6 w-6 text-primary" />,
      title: "Monitor Growth",
      description: "Watch your audience and engagement grow.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-surface-container/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-h2 font-bold text-text-primary mb-4">
            Simple, streamlined success
          </h2>
          <p className="text-body-l text-text-secondary">
            Get started with DoppelCart in four easy steps. No complex setup or
            steep learning curves.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-sm z-10 relative group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-text-on-primary flex items-center justify-center font-bold text-sm border-2 border-surface">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-h5 font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-body-m text-text-secondary">
                  {step.description}
                </p>
              </div>
              
              {/* Connector Line (Desktop Only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-[2px] bg-border -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

