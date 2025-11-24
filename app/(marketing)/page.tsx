import HeroSection from "@/components/marketing/HeroSection";
import ProblemSection from "@/components/marketing/ProblemSection";
import SolutionSection from "@/components/marketing/SolutionSection";
import PlanSection from "@/components/marketing/PlanSection";
import SuccessSection from "@/components/marketing/SuccessSection";
import CTASection from "@/components/marketing/CTASection";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-0">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <PlanSection />
      <SuccessSection />
      <CTASection />
    </div>
  );
}
