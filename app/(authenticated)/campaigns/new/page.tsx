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
import { format } from "date-fns";

interface Persona {
  id: string;
  display_name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    persona_id: "",
    name: "",
    objective: "",
    start_date: "",
    end_date: "",
    status: "draft",
  });

  useEffect(() => {
    async function loadPersonas() {
      try {
        const response = await fetch("/api/personas", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load personas");
        }
        const data = (await response.json()) as Persona[];
        setPersonas(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, persona_id: data[0].id }));
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unexpected error loading personas."
        );
      }
    }
    loadPersonas();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            objective: formData.objective || null,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error || "Failed to create campaign. Please try again."
          );
        }

        const created = await response.json();
        router.push(`/campaigns/${created.id}`);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unexpected error creating campaign."
        );
      }
    });
  };

  const formatDateForInput = (date: string) =>
    date ? format(new Date(date), "yyyy-MM-dd") : "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
          <CardDescription>
            Outline the persona, objectives, and schedule for this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="persona_id">Persona</Label>
              <select
                id="persona_id"
                name="persona_id"
                value={formData.persona_id}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    persona_id: event.target.value,
                  }))
                }
                disabled={personas.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Summer Launch"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Textarea
                id="objective"
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                placeholder="Grow brand awareness by sharing twice-weekly deep dives..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formatDateForInput(formData.start_date)}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formatDateForInput(formData.end_date)}
                  onChange={handleChange}
                  min={formData.start_date || undefined}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !formData.name}>
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

