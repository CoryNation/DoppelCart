"use client";

import { useEffect, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SocialPlatform } from "@/types/social";

interface Persona {
  id: string;
  display_name: string;
}

interface PlatformOption extends SocialPlatform {
  id: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    personaId: "",
    title: "",
    description: "",
    targetPlatforms: [] as string[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [personaRes, platformRes] = await Promise.all([
          fetch("/api/personas", { credentials: "include" }),
          fetch("/api/social/platforms", { credentials: "include" }),
        ]);

        if (!personaRes.ok) {
          throw new Error("Failed to load personas");
        }

        if (!platformRes.ok) {
          throw new Error("Failed to load platforms");
        }

        const [personaData, platformData] = await Promise.all([
          personaRes.json(),
          platformRes.json(),
        ]);

        setPersonas(personaData as Persona[]);
        setPlatforms(platformData as PlatformOption[]);

        if (personaData.length > 0) {
          setFormData((prev) => ({ ...prev, personaId: personaData[0].id }));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load form data."
        );
      }
    }

    loadData();
  }, []);

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => {
      const exists = prev.targetPlatforms.includes(platformId);
      return {
        ...prev,
        targetPlatforms: exists
          ? prev.targetPlatforms.filter((id) => id !== platformId)
          : [...prev.targetPlatforms, platformId],
      };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.personaId) {
      setError("Select a persona first.");
      return;
    }

    if (formData.targetPlatforms.length === 0) {
      setError("Pick at least one platform.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error || "Failed to create campaign. Please try again."
          );
        }

        const created = await response.json();
        router.push(`/campaigns/${created.id}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unexpected error creating campaign."
        );
      }
    });
  };

  const selectedPlatforms = platforms.filter((platform) =>
    formData.targetPlatforms.includes(platform.id)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Campaign</CardTitle>
          <CardDescription>
            Choose a persona, write the brief, and pick launch platforms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="persona">Persona</Label>
              <select
                id="persona"
                name="persona"
                value={formData.personaId}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    personaId: event.target.value,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={personas.length === 0}
              >
                {personas.length === 0 && (
                  <option value="">No personas available</option>
                )}
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Autumn Thought Leadership Sprint"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brief</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="What outcomes should this persona drive? Mention tone, hooks, launch goals."
              />
            </div>

            <div className="space-y-3">
              <Label>Target platforms</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {platforms.map((platform) => {
                  const checked = formData.targetPlatforms.includes(platform.id);
                  return (
                    <label
                      key={platform.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                        checked ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlatform(platform.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{platform.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {platform.status}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {formData.targetPlatforms.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedPlatforms.map((p) => p.display_name).join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {(error || formData.targetPlatforms.length === 0) && (
                <p className="text-sm text-destructive">
                  {error ||
                    "Choose at least one platform to tell the AI where to focus."}
                </p>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !formData.title ||
                    !formData.personaId ||
                    formData.targetPlatforms.length === 0
                  }
                >
                  {isPending ? "Creating..." : "Create campaign"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

