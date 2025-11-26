"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, RotateCw, Trash2, ArrowRight } from "lucide-react";

import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { ResonanceResearchListItem } from "@/types/resonance";
import NewResearchModal from "@/components/research/NewResearchModal";

export default function ResonancePage() {
  const [researchList, setResearchList] = useState<ResonanceResearchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchResearch();
  }, []);

  const fetchResearch = async () => {
    try {
      const res = await fetch("/api/resonance");
      if (res.ok) {
        const data = await res.json();
        setResearchList(data);
      }
    } catch (error) {
      console.error("Failed to fetch research:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async (id: string) => {
    try {
      // Optimistic update
      setResearchList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "running" } : item
        )
      );

      const res = await fetch(`/api/resonance/${id}/rerun`, {
        method: "POST",
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setResearchList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
        );
      } else {
        // Revert on failure (or fetch fresh)
        fetchResearch();
      }
    } catch (error) {
      console.error("Error rerunning research:", error);
      fetchResearch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this research?")) return;

    try {
      const res = await fetch(`/api/resonance/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setResearchList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Error deleting research:", error);
    }
  };

  const getStatusVariant = (
    status: ResonanceResearchListItem["status"]
  ): BadgeProps["variant"] => {
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
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Resonance Research
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze markets, define audiences, and discover winning persona
            archetypes.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Research
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : researchList.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <RotateCw className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">No research found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Start your first Resonance Research to uncover audience insights
                  and persona opportunities.
                </p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Run First Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {researchList.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                  </Badge>
                  {item.last_run_at && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.last_run_at), "MMM d, h:mm a")}
                    </span>
                  )}
                </div>
                <CardTitle className="line-clamp-1 mt-2">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5em]">
                  {item.initial_prompt}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground">
                  {item.persona_count === 0
                    ? "No active personas yet"
                    : `${item.persona_count} persona${
                        item.persona_count === 1 ? "" : "s"
                      } operating in this sector`}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-4 border-t gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRerun(item.id)}
                    disabled={item.status === "running"}
                    title="Rerun Analysis"
                  >
                    <RotateCw
                      className={`h-4 w-4 ${
                        item.status === "running" ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button asChild size="sm">
                  <Link href={`/resonance/${item.id}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <NewResearchModal 
        open={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchResearch();
        }}
      />
    </div>
  );
}
