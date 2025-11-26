"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type {
  Campaign,
  CampaignContent,
  CampaignGenerationJob,
} from "@/types/campaign";
import type { PersonaSocialAccount } from "@/types/social";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleModal } from "@/components/scheduler/ScheduleModal";

interface CampaignDetailClientProps {
  campaign: Campaign;
  personaName: string;
  initialContent: CampaignContent[];
  initialJob: CampaignGenerationJob | null;
}

export default function CampaignDetailClient({
  campaign,
  personaName,
  initialContent,
  initialJob,
}: CampaignDetailClientProps) {
  const [contentItems, setContentItems] =
    useState<CampaignContent[]>(initialContent);
  const [generationJob, setGenerationJob] =
    useState<CampaignGenerationJob | null>(initialJob);
  const [accounts, setAccounts] = useState<PersonaSocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<CampaignContent | null>(
    null
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();

  useEffect(() => {
    async function loadAccounts() {
      setAccountsLoading(true);
      setAccountsError(null);
      try {
        const response = await fetch(
          `/api/social/persona-accounts?personaId=${campaign.persona_id}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Failed to load accounts");
        }
        const data = (await response.json()) as PersonaSocialAccount[];
        setAccounts(data);
      } catch (error) {
        setAccountsError(
          error instanceof Error ? error.message : "Failed to load accounts"
        );
      } finally {
        setAccountsLoading(false);
      }
    }

    loadAccounts();
  }, [campaign.persona_id]);

  const updateContentItem = (updated: CampaignContent) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleGenerate = () => {
    setActionError(null);
    startGenerateTransition(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaign.id}/generate`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Generation failed");
        }
        const data = await response.json();
        setContentItems((prev) => [
          ...(data.created_content as CampaignContent[]),
          ...prev,
        ]);
        setGenerationJob(data.job as CampaignGenerationJob);
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Failed to generate content"
        );
      }
    });
  };

  const handleScheduleSave = async (payload: {
    scheduledFor: string;
    personaSocialAccountId: string;
    platformId?: string;
  }) => {
    if (!scheduleTarget) {
      return;
    }
    setScheduleSaving(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/campaigns/content/${scheduleTarget.id}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to schedule content");
      }
      const updated = (await response.json()) as CampaignContent;
      updateContentItem(updated);
      setScheduleTarget(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to schedule content"
      );
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleUnschedule = async (item: CampaignContent) => {
    setActionError(null);
    const response = await fetch(
      `/api/campaigns/content/${item.id}/unschedule`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setActionError(payload?.error || "Failed to unschedule content");
      return;
    }
    const updated = (await response.json()) as CampaignContent;
    updateContentItem(updated);
  };

  const handleDelete = async (item: CampaignContent) => {
    setActionError(null);
    const response = await fetch(`/api/campaigns/content/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setActionError(payload?.error || "Failed to delete content");
      return;
    }
    setContentItems((prev) => prev.filter((content) => content.id !== item.id));
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "published":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const nextStepsHint = useMemo(() => {
    if (generationJob?.status === "failed") {
      return generationJob.error_message ?? "Generation failed.";
    }
    if (generationJob?.status === "running") {
      return "AI is generating drafts...";
    }
    return null;
  }, [generationJob]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Campaign</p>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
          </div>
          <Badge variant="outline" className="capitalize text-base">
            {campaign.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            Persona: <span className="font-medium text-foreground">{personaName}</span>
          </span>
          <span>
            Created {new Date(campaign.created_at).toLocaleDateString()}
          </span>
          <span>
            Content items:{" "}
            <span className="font-medium text-foreground">
              {contentItems.length}
            </span>
          </span>
        </div>
        {campaign.description && (
          <p className="text-base text-muted-foreground">{campaign.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {campaign.target_platforms.length === 0 ? (
            <Badge variant="secondary">No platforms selected</Badge>
          ) : (
            campaign.target_platforms.map((platform) => (
              <Badge key={platform} variant="secondary">
                {platform}
              </Badge>
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate AI content"}
          </Button>
          <Link
            href="/campaigns"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to all campaigns
          </Link>
        </div>
        {nextStepsHint && (
          <p className="text-sm text-muted-foreground">{nextStepsHint}</p>
        )}
        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
        {accountsError && (
          <p className="text-sm text-destructive">{accountsError}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content items</CardTitle>
          <CardDescription>
            AI will drop drafts here. Edit, schedule, or delete as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content yet. Generate drafts to start planning.
            </p>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      {item.content_json.title && (
                        <h3 className="text-lg font-semibold">
                          {item.content_json.title}
                        </h3>
                      )}
                      <Badge variant={statusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNow(new Date(item.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                    {item.content_json.text}
                  </p>
                  {item.content_json.recommended_platforms &&
                    item.content_json.recommended_platforms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.content_json.recommended_platforms.map(
                          (platform) => (
                            <Badge key={platform} variant="outline">
                              {platform}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {item.scheduled_for ? (
                      <p>
                        Scheduled for{" "}
                        {new Date(item.scheduled_for).toLocaleString()}
                      </p>
                    ) : (
                      <p>Not scheduled</p>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/campaigns/${campaign.id}/content/${item.id}`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setScheduleTarget(item)}
                      disabled={accountsLoading || accounts.length === 0}
                    >
                      {item.scheduled_for ? "Reschedule" : "Schedule"}
                    </Button>
                    {item.scheduled_for && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnschedule(item)}
                      >
                        Unschedule
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleModal
        isOpen={Boolean(scheduleTarget)}
        onClose={() => setScheduleTarget(null)}
        onSave={handleScheduleSave}
        accounts={accounts}
        defaultDate={scheduleTarget?.scheduled_for}
        defaultAccountId={scheduleTarget?.persona_social_account_id ?? undefined}
        saving={scheduleSaving}
        error={actionError}
      />
    </div>
  );
}


