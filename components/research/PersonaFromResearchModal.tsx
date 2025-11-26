"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import Button from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/modal";
import type { ResearchPersona } from "@/types/persona";

interface PersonaFromResearchModalProps {
  open: boolean;
  onClose: () => void;
  researchId: string;
  researchTitle: string;
}

export default function PersonaFromResearchModal({
  open,
  onClose,
  researchId,
  researchTitle,
}: PersonaFromResearchModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [persona, setPersona] = useState<ResearchPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!open) {
      setPersona(null);
      setError(null);
      setIsGenerating(false);
      setIsSaving(false);
      setSaveSuccess(false);
      setRetryCount(0);
    }
  }, [open]);

  const handleGenerate = async (isRetry = false) => {
    setIsGenerating(true);
    setError(null);
    setSaveSuccess(false);
    if (!isRetry) {
      setRetryCount(0);
    }
    try {
      const res = await fetch("/api/personas/from-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.error || "Failed to generate persona";
        throw new Error(
          typeof errorMessage === "string" 
            ? errorMessage 
            : "Failed to generate persona. Please try again."
        );
      }

      const data = await res.json();
      if (!data.persona) {
        throw new Error("Invalid response from server");
      }
      setPersona(data.persona as ResearchPersona);
      setRetryCount(0); // Reset on success
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Something went wrong while generating the persona. Please try again.";
      setError(errorMessage);
      // Don't increment retry count if we've already hit max
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      handleGenerate(true);
    }
  };

  const handleSavePersona = async () => {
    if (!persona) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, researchId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.error || "Failed to save persona";
        throw new Error(
          typeof errorMessage === "string"
            ? errorMessage
            : "Failed to save persona. Please try again."
        );
      }

      setSaveSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the persona. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const introContent = useMemo(
    () => ({
      title: "Generate a persona straight from this research",
      bullets: [
        "Automatically summarizes the final report into a launch-ready persona.",
        "Outputs goals, pains, hooks, and CTA styles you can copy directly into briefs.",
        "You can save the persona now and refine it further inside the Persona Builder later.",
      ],
    }),
    []
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Generate Persona from Research"
      size="xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p>{error}</p>
                {retryCount < MAX_RETRIES && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can retry ({MAX_RETRIES - retryCount} attempts remaining)
                  </p>
                )}
              </div>
            </div>
            {retryCount < MAX_RETRIES && (
              <Button
                onClick={handleRetry}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Retry Generation
              </Button>
            )}
          </div>
        )}

        {!persona && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Research: {researchTitle}
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                {introContent.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {introContent.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p>
                Click &quot;Generate Persona&quot; to synthesize the final
                report into a structured persona (name, goals, pains, preferred
                hooks, language, and CTA styles). You can then save it to your
                Personas area for further editing.
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isGenerating
                  ? "Synthesizing persona…"
                  : "Generate Persona"}
              </Button>
            </div>
          </div>
        )}

        {persona && (
          <div className="space-y-5">
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {persona.label}
                </p>
                <h2 className="text-2xl font-semibold">{persona.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {persona.summary}
                </p>
              </div>
              <div className="min-w-[220px] rounded-lg border bg-muted/30 p-4 text-sm">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Demographic Snapshot
                </h4>
                <dl className="mt-2 space-y-1">
                  <ItemRow
                    label="Role"
                    value={persona.demographics.roleOrProfession}
                  />
                  <ItemRow
                    label="Experience"
                    value={persona.demographics.experienceLevel}
                  />
                  <ItemRow
                    label="Org"
                    value={persona.demographics.organizationContext}
                  />
                  <ItemRow
                    label="Region"
                    value={persona.demographics.geography}
                  />
                  <ItemRow label="Notes" value={persona.demographics.other} />
                </dl>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <PersonaList title="Goals" items={persona.goals} />
              <PersonaList
                title="Pain Points"
                items={persona.painPoints}
                tone="danger"
              />
              <PersonaList title="Motivators" items={persona.motivators} />
              <PersonaList title="Objections" items={persona.objections} />
            </div>

            <section className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Channel Preferences</h3>
              <PersonaList items={persona.preferredChannels} muted className="mt-2" />
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Content Preferences</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <PersonaList
                  title="Formats"
                  items={persona.contentPreferences.formats}
                />
                <PersonaList
                  title="Tones"
                  items={persona.contentPreferences.tones}
                />
                <PersonaList
                  title="Angles That Resonate"
                  items={persona.contentPreferences.anglesThatResonate}
                />
                <PersonaList
                  title="Angles to Avoid"
                  items={persona.contentPreferences.anglesToAvoid}
                  tone="danger"
                />
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Language &amp; Voice</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <PersonaList
                  title="Sample Phrases"
                  items={persona.languageAndVoice.samplePhrases}
                />
                <PersonaList
                  title="Do Say"
                  items={persona.languageAndVoice.doSay}
                />
                <PersonaList
                  title="Don't Say"
                  items={persona.languageAndVoice.dontSay}
                  tone="danger"
                />
              </div>
            </section>

            <section className="rounded-lg border bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-primary-foreground/80">
                Example Hooks
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">
                {persona.exampleHooks.map((hook) => (
                  <li key={hook} className="rounded bg-background/60 p-3">
                    {hook}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Call-to-Action Styles</h3>
              <PersonaList
                items={persona.callToActionStyles}
                muted
                className="mt-2"
              />
            </section>

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Persona saved! You can now close this modal or continue
                refining it later.
              </div>
            )}
          </div>
        )}
      </div>

      <ModalFooter className="justify-between">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        {persona ? (
          <Button onClick={handleSavePersona} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving…" : "Save Persona"}
          </Button>
        ) : (
          <Button onClick={() => handleGenerate(false)} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Generating…" : "Generate Persona"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

interface PersonaListProps {
  title?: string;
  items: string[];
  tone?: "default" | "danger";
  muted?: boolean;
  className?: string;
}

function PersonaList({
  title,
  items,
  tone = "default",
  muted,
  className,
}: PersonaListProps) {
  const safeItems = items?.length ? items : ["Not captured yet."];
  return (
    <div className={className}>
      {title && (
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {title}
        </p>
      )}
      <ul
        className={`mt-2 list-disc space-y-1 pl-5 text-sm ${
          muted ? "text-muted-foreground" : ""
        } ${tone === "danger" ? "text-destructive" : ""}`}
      >
        {safeItems.map((item, idx) => (
          <li key={`${item}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ItemRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="text-right text-text-primary">
        {value?.trim() || "—"}
      </span>
    </div>
  );
}




