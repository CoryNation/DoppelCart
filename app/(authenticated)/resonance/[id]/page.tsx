"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  RotateCw,
  Trash2,
  Save,
  Play,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ResonanceResearchResult } from "@/types/resonance";

interface LinkedPersona {
  persona_id: string;
  personas: {
    id: string;
    display_name: string;
    avatar_image_url?: string;
  };
}

interface ResonanceResearchDetail {
  id: string;
  user_id: string;
  title: string;
  initial_prompt: string;
  input_context: any | null;
  result: ResonanceResearchResult | null;
  status: "running" | "completed" | "failed";
  error_message: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  resonance_research_personas: LinkedPersona[];
}

export default function ResonanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [research, setResearch] = useState<ResonanceResearchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    fetchResearch();
  }, [params.id]);

  const fetchResearch = async () => {
    try {
      const res = await fetch(`/api/resonance/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setResearch(data);
        setPrompt(data.initial_prompt);
        setTitle(data.title);
      } else {
        // Handle 404/403
        router.push("/resonance");
      }
    } catch (error) {
      console.error("Failed to fetch research:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rerunAfterSave = false) => {
    if (!research) return;
    setSaving(true);
    try {
      // 1. Save prompt/title
      const res = await fetch(`/api/resonance/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          initial_prompt: prompt,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setResearch((prev) => (prev ? { ...prev, ...updated } : null));

        if (rerunAfterSave) {
          await handleRerun();
        }
      }
    } catch (error) {
      console.error("Error saving research:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRerun = async () => {
    if (!research) return;
    setRerunning(true);
    // Optimistic update
    setResearch((prev) => (prev ? { ...prev, status: "running" } : null));

    try {
      const res = await fetch(`/api/resonance/${params.id}/rerun`, {
        method: "POST",
      });

      if (res.ok) {
        const updated = await res.json();
        setResearch((prev) => (prev ? { ...prev, ...updated } : null));
      } else {
        fetchResearch(); // Revert on failure
      }
    } catch (error) {
      console.error("Error rerunning:", error);
      fetchResearch();
    } finally {
      setRerunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this study?")) return;
    try {
      const res = await fetch(`/api/resonance/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/resonance");
      }
    } catch (error) {
      console.error("Error deleting research:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "running":
        return "warning";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3 mb-4" />
        <div className="h-64 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!research) return null;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/resonance")}
              className="p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-auto border-transparent hover:border-input focus:border-input px-0 w-auto min-w-[300px]"
            />
            <Badge variant={getStatusColor(research.status) as any}>
              {research.status}
            </Badge>
          </div>
          {research.last_run_at && (
            <p className="text-sm text-muted-foreground">
              Last run: {format(new Date(research.last_run_at), "PPP p")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleRerun()}
            disabled={research.status === "running"}
          >
            <RotateCw
              className={`mr-2 h-4 w-4 ${
                research.status === "running" ? "animate-spin" : ""
              }`}
            />
            Re-run
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Prompt & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Research Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Context & Goals</Label>
                <textarea
                  id="prompt"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              {research.input_context && (
                <div className="space-y-2">
                  <Label>Structured Context</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(research.input_context, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => handleSave(false)}
                disabled={saving || research.status === "running"}
                variant="outline"
              >
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button
                className="w-full"
                onClick={() => handleSave(true)}
                disabled={saving || research.status === "running"}
              >
                <Play className="mr-2 h-4 w-4" /> Save & Run
              </Button>
            </CardFooter>
          </Card>

          {/* Linked Personas */}
          <Card>
            <CardHeader>
              <CardTitle>Active Personas</CardTitle>
              <CardDescription>
                Personas built from this research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {research.resonance_research_personas.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No personas linked yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {research.resonance_research_personas.map((link) => (
                    <div
                      key={link.persona_id}
                      className="flex items-center gap-3 p-2 rounded bg-muted/50 border"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {link.personas.display_name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {link.personas.display_name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 w-7 p-0"
                      >
                        <a href={`/agents/${link.persona_id}`}>
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary" asChild>
                <a href={`/agents/new?fromResearchId=${research.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Persona
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-2 space-y-6">
          {research.status === "running" ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative bg-primary text-primary-foreground p-4 rounded-full">
                  <RotateCw className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Analyzing Resonance</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Our AI is analyzing your audience, identifying archetypes, and
                  predicting content performance. This usually takes about 30
                  seconds.
                </p>
              </div>
            </Card>
          ) : research.status === "failed" ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Analysis Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {research.error_message ||
                    "An unknown error occurred during the research process."}
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleRerun} variant="destructive">
                  Try Again
                </Button>
              </CardFooter>
            </Card>
          ) : !research.result ? (
            <Card className="py-12 text-center">
              <CardContent>
                <p className="text-muted-foreground">
                  No results available yet. Run the analysis to see insights.
                </p>
                <Button onClick={handleRerun} className="mt-4">
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-m">{research.result.summary}</p>
                </CardContent>
              </Card>

              {/* Audience Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Audience Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    {research.result.audience_profile.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Pains</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {research.result.audience_profile.pains.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Desires</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {research.result.audience_profile.desires.map(
                          (d, i) => (
                            <li key={i}>{d}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Winning Archetypes */}
              <Card>
                <CardHeader>
                  <CardTitle>Winning Archetypes</CardTitle>
                  <CardDescription>
                    Recommended persona strategies for this audience
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {research.result.winning_persona_archetypes.map((arch, i) => (
                    <div
                      key={i}
                      className="border rounded-lg p-4 bg-muted/10 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{arch.name}</h4>
                        <Badge variant="outline">{arch.tone}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {arch.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            Strengths:
                          </span>{" "}
                          {arch.strengths.join(", ")}
                        </div>
                        <div>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            Pitfalls:
                          </span>{" "}
                          {arch.pitfalls.join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Platforms & Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platforms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {research.result.platforms.map((plat, i) => (
                      <div key={i} className="space-y-1 pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex justify-between font-semibold text-sm">
                          <span>{plat.name}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {plat.posting_cadence}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plat.role}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plat.content_formats.map((fmt, j) => (
                            <Badge key={j} variant="secondary" className="text-[10px] px-1 h-5">
                              {fmt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Themes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {research.result.content_themes.map((theme, i) => (
                      <div key={i} className="pb-4 border-b last:border-0 last:pb-0">
                        <h4 className="font-semibold text-sm">{theme.theme}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {theme.why_it_resonates}
                        </p>
                        <div className="mt-2 text-xs italic text-muted-foreground/80">
                          &quot;{theme.example_hooks[0]}&quot;
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Style Guide */}
              <Card>
                <CardHeader>
                  <CardTitle>Style Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                     <h4 className="font-semibold text-sm mb-1">Voice</h4>
                     <p className="text-sm text-muted-foreground">{research.result.style_guide.voice}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Do</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {research.result.style_guide.do.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Don&apos;t</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {research.result.style_guide.dont.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">Taboo</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {research.result.style_guide.taboo_topics.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* Persona Blueprint */}
               <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Recommended Blueprint</CardTitle>
                  <CardDescription>
                    Starting point for your new persona
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Working Name</Label>
                      <p className="font-semibold">{research.result.persona_blueprint.working_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tagline</Label>
                      <p className="font-semibold">{research.result.persona_blueprint.tagline}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Core Traits</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {research.result.persona_blueprint.core_traits.map((trait, i) => (
                        <Badge key={i} variant="outline" className="bg-background">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                   <div>
                    <Label className="text-xs text-muted-foreground">Signature Content</Label>
                     <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                        {research.result.persona_blueprint.signature_content_types.map((type, i) => (
                          <li key={i}>{type}</li>
                        ))}
                      </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

