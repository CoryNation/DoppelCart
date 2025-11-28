"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignContent } from "@/types/campaign";
import type { PersonaSocialAccount } from "@/types/social";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScheduleModal } from "@/components/scheduler/ScheduleModal";

interface CampaignContentEditorProps {
  campaignId: string;
  campaignName: string;
  content: CampaignContent;
  personaId: string;
}

export default function CampaignContentEditor({
  campaignId,
  campaignName,
  content,
  personaId,
}: CampaignContentEditorProps) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    title: content.content_json.title ?? "",
    text: content.content_json.text ?? "",
    image_prompt: content.content_json.image_prompt ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<PersonaSocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [workingContent, setWorkingContent] = useState<CampaignContent>(content);

  useEffect(() => {
    async function loadAccounts() {
      setAccountsLoading(true);
      try {
        const response = await fetch(
          `/api/social/persona-accounts?personaId=${personaId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Failed to load accounts");
        }
        const data = (await response.json()) as PersonaSocialAccount[];
        setAccounts(data);
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Failed to load accounts"
        );
      } finally {
        setAccountsLoading(false);
      }
    }

    loadAccounts();
  }, [personaId]);

  const handleSave = async () => {
    setSaving(true);
    setActionError(null);
    try {
      const response = await fetch("/api/campaign-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: workingContent.id,
          content_json: {
            title: formState.title,
            text: formState.text,
            image_prompt: formState.image_prompt || undefined,
            recommended_platforms: workingContent.content_json.recommended_platforms,
          },
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save content");
      }
      const updated = (await response.json()) as CampaignContent;
      setWorkingContent(updated);
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to save content"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    const response = await fetch(`/api/campaigns/content/${workingContent.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ error: "Failed to delete content" }));
      setActionError(payload?.error ?? "Failed to delete content");
      return;
    }
    router.push(`/campaigns/${campaignId}`);
  };

  const handleScheduleSave = async (payload: {
    scheduledFor: string;
    personaSocialAccountId: string;
    platformId?: string;
  }) => {
    setScheduleSaving(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/campaigns/content/${workingContent.id}/schedule`,
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
      setWorkingContent(updated);
      setScheduleModalOpen(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to schedule content"
      );
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleUnschedule = async () => {
    setActionError(null);
    const response = await fetch(
      `/api/campaigns/content/${workingContent.id}/unschedule`,
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
    setWorkingContent(updated);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{campaignName}</p>
        <h1 className="text-3xl font-bold">Edit content</h1>
        <p className="text-sm text-muted-foreground">
          Adjust copy, review prompts, and schedule when ready.
        </p>
        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copy</CardTitle>
          <CardDescription>
            Keep the persona voice and campaign goal in mind.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formState.title}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Hook or headline"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              rows={8}
              value={formState.text}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, text: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image_prompt">Image prompt</Label>
            <Textarea
              id="image_prompt"
              rows={3}
              value={formState.image_prompt}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  image_prompt: event.target.value,
                }))
              }
              placeholder="Describe a supporting visual concept"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {workingContent.content_json.recommended_platforms?.map(
              (platform) => (
                <Badge key={platform} variant="secondary">
                  {platform}
                </Badge>
              )
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formState.text}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            Push to a connected account when the copy is ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{workingContent.status}</Badge>
            {workingContent.scheduled_for ? (
              <span className="text-sm text-muted-foreground">
                Scheduled for{" "}
                {new Date(workingContent.scheduled_for).toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Not scheduled</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setScheduleModalOpen(true)}
              disabled={accountsLoading || accounts.length === 0}
            >
              {workingContent.scheduled_for ? "Reschedule" : "Schedule"}
            </Button>
            {workingContent.scheduled_for && (
              <Button variant="ghost" onClick={handleUnschedule}>
                Unschedule
              </Button>
            )}
            <Button variant="ghost" onClick={handleDelete}>
              Delete
            </Button>
          </div>
          {accounts.length === 0 && !accountsLoading && (
            <p className="text-sm text-muted-foreground">
              Connect a social account for this persona to enable scheduling.
            </p>
          )}
        </CardContent>
      </Card>

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSave={handleScheduleSave}
        accounts={accounts}
        defaultDate={workingContent.scheduled_for}
        defaultAccountId={workingContent.persona_social_account_id ?? undefined}
        saving={scheduleSaving}
        error={actionError}
      />
    </div>
  );
}





