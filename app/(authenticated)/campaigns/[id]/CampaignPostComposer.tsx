"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PersonaAccount {
  id: string;
  platform_id: string;
  display_name: string | null;
  account_handle: string | null;
  status: string;
  last_token_error: string | null;
}

interface CampaignPostComposerProps {
  campaignId: string;
  personaId: string;
  personaAccounts: PersonaAccount[];
}

export function CampaignPostComposer({
  campaignId,
  personaId,
  personaAccounts,
}: CampaignPostComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    persona_social_account_id:
      personaAccounts.find((acc) => acc.status === "connected")?.id ?? "",
    status: "draft",
    scheduled_for: "",
    content_text: "",
    image_url: "",
  });

  const selectedAccount = personaAccounts.find(
    (acc) => acc.id === formData.persona_social_account_id
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.persona_social_account_id) {
      setError("Select a social account.");
      return;
    }
    if (!selectedAccount) {
      setError("Selected account is unavailable.");
      return;
    }
    if (!formData.content_text.trim()) {
      setError("Content cannot be empty.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/campaign-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            campaign_id: campaignId,
            persona_id: personaId,
            persona_social_account_id: selectedAccount.id,
            platform_id: selectedAccount.platform_id,
            status: formData.status,
            scheduled_for: formData.scheduled_for || null,
            content_json: {
              text: formData.content_text,
              image_url: formData.image_url || undefined,
            },
            created_by: "user",
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error || "Failed to create campaign post. Try again."
          );
        }

        setFormData((prev) => ({
          ...prev,
          content_text: "",
          image_url: "",
          status: "draft",
          scheduled_for: "",
        }));
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unexpected error creating post."
        );
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="persona_social_account_id">Account</Label>
        <select
          id="persona_social_account_id"
          name="persona_social_account_id"
          value={formData.persona_social_account_id}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              persona_social_account_id: event.target.value,
            }))
          }
          disabled={personaAccounts.length === 0 || isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select account</option>
          {personaAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name ?? account.platform_id}
              {account.account_handle ? ` (${account.account_handle})` : ""}
              {account.status !== "connected" ? " · inactive" : ""}
            </option>
          ))}
        </select>
        {selectedAccount?.last_token_error && (
          <p className="text-xs text-destructive">
            Last error: {selectedAccount.last_token_error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, status: event.target.value }))
            }
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_for">Scheduled time</Label>
          <Input
            id="scheduled_for"
            name="scheduled_for"
            type="datetime-local"
            value={formData.scheduled_for}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                scheduled_for: event.target.value,
              }))
            }
            disabled={isPending || formData.status !== "scheduled"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content_text">Content</Label>
        <Textarea
          id="content_text"
          name="content_text"
          rows={4}
          value={formData.content_text}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              content_text: event.target.value,
            }))
          }
          placeholder="What should this campaign say?"
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL (optional)</Label>
        <Input
          id="image_url"
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              image_url: event.target.value,
            }))
          }
          disabled={isPending}
          placeholder="https://"
        />
      </div>

      <div className="flex justify-between items-center">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending || !formData.content_text}>
          {isPending ? "Creating..." : "Create post"}
        </Button>
      </div>
    </form>
  );
}

