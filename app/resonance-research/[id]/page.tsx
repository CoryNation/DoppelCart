import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getServerUser } from "@/lib/auth/getServerUser";
import {
  getResearchTaskById,
  type ResonanceFinalReport,
  type ResearchTask,
} from "@/lib/research";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Badge, { type BadgeProps } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import GeneratePersonaFromResearch from "@/components/research/GeneratePersonaFromResearch";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResearchResultPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getServerUser();
  const research = await getResearchTaskById(id, user.id);

  if (!research) {
    notFound();
  }

  const report = research.resultDetails?.finalReport as
    | ResonanceFinalReport
    | undefined;
  const summaryLine =
    research.resultSummary ||
    report?.executiveSummary?.split(".")[0] ||
    research.description;
  const canGeneratePersona =
    research.status === "completed" && Boolean(report);
  const personaDisabledReason =
    research.status !== "completed"
      ? "Research is still running."
      : !report
      ? "This research has not produced a final report yet."
      : undefined;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={getStatusVariant(research.status)}>
            {research.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Updated {format(new Date(research.updatedAt), "PPP p")}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {research.title}
          </h1>
          {summaryLine && (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {summaryLine}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          {report ? (
            <>
              <SummaryCard report={report} />
              <AudienceSnapshot report={report} />
              <ResonanceFindings report={report} />
              <ChannelInsights report={report} />
              <MessagingRecommendations report={report} />
              <Objections report={report} />
              <NextSteps report={report} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Final report not ready yet</CardTitle>
                <CardDescription>
                  This research either hasn&apos;t completed or is still
                  synthesizing the final report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The report will appear here once the research reaches the
                  &quot;completed&quot; state. Check back in a little bit or
                  refresh the page to see the final insights.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="space-y-6">
          <ActionPanel
            research={research}
            canGeneratePersona={canGeneratePersona}
            personaDisabledReason={personaDisabledReason}
          />
          <MetadataCard research={research} />
          <ParametersCard parameters={research.parameters} />
        </aside>
      </div>
    </div>
  );
}

function getStatusVariant(status: ResearchTask["status"]): BadgeProps["variant"] {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "secondary";
  }
}

function SummaryCard({ report }: { report: ResonanceFinalReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Executive Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {report.executiveSummary}
        </p>
      </CardContent>
    </Card>
  );
}

function AudienceSnapshot({ report }: { report: ResonanceFinalReport }) {
  const snapshot = report.audienceSnapshot;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Snapshot</CardTitle>
        <CardDescription>{snapshot.whoTheyAre}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Key Motivations
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {snapshot.keyMotivations.map((motivation) => (
              <li key={motivation}>{motivation}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Key Frustrations
          </h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {snapshot.keyFrustrations.map((frustration) => (
              <li key={frustration}>{frustration}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ResonanceFindings({ report }: { report: ResonanceFinalReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resonance Findings</CardTitle>
        <CardDescription>
          Priority themes with implications for messaging and execution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.resonanceFindings.map((finding) => (
          <div
            key={finding.theme}
            className="rounded-lg border border-border/60 p-4"
          >
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-semibold text-foreground">
                {finding.theme}
              </h4>
              <p className="text-sm text-muted-foreground">
                {finding.description}
              </p>
            </div>
            {finding.supportingEvidence.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Supporting evidence
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {finding.supportingEvidence.map((evidence) => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              </div>
            )}
            {finding.implications.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Implications
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {finding.implications.map((implication) => (
                    <li key={implication}>{implication}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChannelInsights({ report }: { report: ResonanceFinalReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel &amp; Format Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {report.channelAndFormatInsights.byPlatform.map((platform) => (
            <div
              key={platform.platform}
              className="rounded-lg border border-dashed p-4"
            >
              <h4 className="text-sm font-semibold">{platform.platform}</h4>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <InsightList title="What works" items={platform.whatWorks} />
                <InsightList
                  title="What to avoid"
                  items={platform.whatToAvoid}
                  danger
                />
                <InsightList
                  title="Example angles"
                  items={platform.exampleAngles}
                />
              </div>
            </div>
          ))}
        </div>
        {report.channelAndFormatInsights.crossPlatformPatterns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Cross-platform patterns</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {report.channelAndFormatInsights.crossPlatformPatterns.map(
                (pattern) => (
                  <li key={pattern}>{pattern}</li>
                )
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightList({
  title,
  items,
  danger,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-semibold uppercase ${
          danger ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {title}
      </p>
      <ul
        className={`mt-2 list-disc space-y-1 pl-4 text-sm ${
          danger ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MessagingRecommendations({ report }: { report: ResonanceFinalReport }) {
  const messaging = report.messagingRecommendations;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messaging Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <RecommendationList title="Core Narratives" items={messaging.coreNarratives} />
        <RecommendationList title="Recommended Hooks" items={messaging.recommendedHooks} />
        <RecommendationList title="Language to Use" items={messaging.languageToUse} />
        <RecommendationList
          title="Language to Avoid"
          items={messaging.languageToAvoid}
          danger
        />
      </CardContent>
    </Card>
  );
}

function RecommendationList({
  title,
  items,
  danger,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul
        className={`mt-2 list-disc space-y-1 pl-5 text-sm ${
          danger ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Objections({ report }: { report: ResonanceFinalReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objections &amp; Responses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.objectionsAndResponses.map((objection) => (
          <div
            key={objection.objection}
            className="rounded-lg border border-border/60 p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              {objection.objection}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Context: {objection.context}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Recommended response: {objection.recommendedResponseAngle}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NextSteps({ report }: { report: ResonanceFinalReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {report.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ActionPanel({
  research,
  canGeneratePersona,
  personaDisabledReason,
}: {
  research: ResearchTask;
  canGeneratePersona: boolean;
  personaDisabledReason?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle>Persona Actions</CardTitle>
        <CardDescription>
          Convert this report into a ready-to-use persona brief.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GeneratePersonaFromResearch
          researchId={research.id}
          researchTitle={research.title}
          disabled={!canGeneratePersona}
          disabledReason={personaDisabledReason}
          buttonVariant="filled"
          buttonFullWidth
        />
        <p className="text-xs text-muted-foreground">
          The persona generator maps your executive summary, findings, and
          messaging recommendations into a structured persona you can save to
          your Personas workspace.
        </p>
      </CardContent>
    </Card>
  );
}

function MetadataCard({ research }: { research: ResearchTask }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Progress
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={research.progress} className="h-2 flex-1" />
            <span className="text-sm font-medium text-foreground">
              {research.progress}%
            </span>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <MetadataRow label="Created">
            {format(new Date(research.createdAt), "PPP p")}
          </MetadataRow>
          <MetadataRow label="Updated">
            {format(new Date(research.updatedAt), "PPP p")}
          </MetadataRow>
          <MetadataRow label="Clarified Scope">
            {research.clarifiedScope || "Not captured yet."}
          </MetadataRow>
        </dl>
      </CardContent>
    </Card>
  );
}

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

function ParametersCard({
  parameters,
}: {
  parameters: Record<string, unknown> | null;
}) {
  const entries = Object.entries(parameters ?? {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
        <CardDescription>
          Inputs gathered during the clarification phase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No structured parameters were provided for this research run.
          </p>
        ) : (
          <dl className="space-y-3 text-sm">
            {entries.map(([key, value]) => (
              <div key={key}>
                <p className="text-xs uppercase text-muted-foreground">
                  {key}
                </p>
                <p className="text-sm text-foreground">
                  {formatParameterValue(value)}
                </p>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function formatParameterValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value.map((item) => formatParameterValue(item)).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}


