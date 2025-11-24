import { CheckCircle2, XCircle } from "lucide-react";
import Card, { CardContent } from "@/components/ui/card";

export default function SuccessSection() {
  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-h2 font-bold text-text-primary mb-4">
            The DoppelCart Advantage
          </h2>
          <p className="text-body-l text-text-secondary">
            See the difference between manual management and AI-powered
            automation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Before */}
          <Card variant="outlined" className="bg-surface-container-high/30 border-danger/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="h-6 w-6 text-danger" />
                <h3 className="text-h4 font-semibold text-text-primary">
                  Without DoppelCart
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-text-secondary">
                  <span className="text-danger select-none">×</span>
                  Inconsistent posting schedule
                </li>
                <li className="flex gap-3 text-text-secondary">
                  <span className="text-danger select-none">×</span>
                  Hours wasted on content creation
                </li>
                <li className="flex gap-3 text-text-secondary">
                  <span className="text-danger select-none">×</span>
                  Generic, unengaging copy
                </li>
                <li className="flex gap-3 text-text-secondary">
                  <span className="text-danger select-none">×</span>
                  Stagnant audience growth
                </li>
                <li className="flex gap-3 text-text-secondary">
                  <span className="text-danger select-none">×</span>
                  Platform burnout
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* After */}
          <Card variant="elevated" className="bg-surface-container border-primary/20 ring-1 ring-primary/10">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <h3 className="text-h4 font-semibold text-text-primary">
                  With DoppelCart
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-text-primary font-medium">
                  <span className="text-success select-none">✓</span>
                  Daily automated publishing
                </li>
                <li className="flex gap-3 text-text-primary font-medium">
                  <span className="text-success select-none">✓</span>
                  Zero time spent writing
                </li>
                <li className="flex gap-3 text-text-primary font-medium">
                  <span className="text-success select-none">✓</span>
                  Viral-optimized hooks & threads
                </li>
                <li className="flex gap-3 text-text-primary font-medium">
                  <span className="text-success select-none">✓</span>
                  Consistent, compounding growth
                </li>
                <li className="flex gap-3 text-text-primary font-medium">
                  <span className="text-success select-none">✓</span>
                  Focus entirely on your product
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

