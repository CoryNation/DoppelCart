'use client';

import React, { useState } from 'react';
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Target, Heart, Lightbulb, TrendingUp } from 'lucide-react';

interface AnalysisResult {
  core_drivers: {
    intrinsic: string[];
    extrinsic: string[];
  };
  cultivated_persona: string;
  definition_of_success: string;
  guiding_values: string[];
  interests_and_growth: {
    key_interests: string[];
    passions: string[];
    growth_areas: string[];
  };
}

interface LinkedInAnalysisResultsProps {
  title: string;
  description?: string;
  analysis: AnalysisResult;
  onBack: () => void;
}

export default function LinkedInAnalysisResults({
  title,
  description,
  analysis,
  onBack,
}: LinkedInAnalysisResultsProps) {
  const [isCreatingPersona, setIsCreatingPersona] = useState(false);

  const handleCreatePersona = async () => {
    setIsCreatingPersona(true);
    // TODO: Navigate to persona creation with analysis data
    // For now, just show a message
    alert('Persona creation from analysis will be implemented next. This will allow you to create a persona based on these insights.');
    setIsCreatingPersona(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-text-secondary mt-1">{description}</p>
          )}
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Drivers */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Core Drivers & Motivations
            </CardTitle>
            <CardDescription>
              What drives this person&apos;s actions and decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-text-secondary">
                Intrinsic Motivators
              </h4>
              <ul className="space-y-1">
                {analysis.core_drivers.intrinsic.map((driver, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-text-secondary">
                Extrinsic Motivators
              </h4>
              <ul className="space-y-1">
                {analysis.core_drivers.extrinsic.map((driver, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cultivated Persona */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Cultivated Persona
            </CardTitle>
            <CardDescription>
              How they want to be perceived
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.cultivated_persona}</p>
          </CardContent>
        </Card>

        {/* Definition of Success */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Definition of Success
            </CardTitle>
            <CardDescription>
              What a &quot;win&quot; looks like for them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.definition_of_success}</p>
          </CardContent>
        </Card>

        {/* Guiding Values */}
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Guiding Values
            </CardTitle>
            <CardDescription>
              Core principles that guide their decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.guiding_values.map((value, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Interests, Passions, and Growth */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Key Interests, Passions & Growth Areas
            </CardTitle>
            <CardDescription>
              What they care about and where they&apos;re seeking development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-text-secondary">
                Key Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.interests_and_growth.key_interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-text-secondary">
                Passions
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.interests_and_growth.passions.map((passion, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                  >
                    {passion}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-text-secondary">
                Areas Seeking Growth
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.interests_and_growth.growth_areas.map((area, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Start New Analysis
        </Button>
        <Button onClick={handleCreatePersona} disabled={isCreatingPersona}>
          {isCreatingPersona ? 'Creating...' : 'Create Persona from Analysis'}
        </Button>
      </div>
    </div>
  );
}

