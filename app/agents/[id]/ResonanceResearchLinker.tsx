"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming you have shadcn select
// If Select isn't available, we'll use a native select or similar. 
// Assuming Select is standard shadcn setup. If not, I can adjust.

interface Study {
  id: string;
  title: string;
  created_at: string;
}

interface ResonanceResearchLinkerProps {
  personaId: string;
  initialLinkedStudies: Study[];
  availableStudies: Study[];
}

export function ResonanceResearchLinker({
  personaId,
  initialLinkedStudies,
  availableStudies,
}: ResonanceResearchLinkerProps) {
  const [linkedStudies, setLinkedStudies] = useState<Study[]>(initialLinkedStudies);
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);

  // Filter out already linked studies from the dropdown
  const availableToLink = availableStudies.filter(
    (study) => !linkedStudies.some((linked) => linked.id === study.id)
  );

  const handleLink = async () => {
    if (!selectedStudyId) return;

    setIsLinking(true);
    try {
      const res = await fetch("/api/resonance/link-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researchId: selectedStudyId,
          personaId: personaId,
        }),
      });

      if (res.ok) {
        const studyToAdd = availableStudies.find((s) => s.id === selectedStudyId);
        if (studyToAdd) {
          setLinkedStudies([...linkedStudies, studyToAdd]);
          setSelectedStudyId("");
        }
      } else {
        console.error("Failed to link study");
      }
    } catch (error) {
      console.error("Error linking study:", error);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-4">
      {linkedStudies.length > 0 && (
        <div className="space-y-2">
          {linkedStudies.map((study) => (
            <div
              key={study.id}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm border"
            >
              <span className="truncate font-medium flex-1 mr-2" title={study.title}>
                {study.title}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link href={`/resonance/${study.id}`} title="View Research">
                   <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {availableToLink.length > 0 ? (
          <div className="flex gap-2">
             {/* Using native select for simplicity if Select component has complex dependencies, 
                 but standard shadcn Select is preferred if available. 
                 I'll use a native select here to be safe and robust without knowing exact UI component exports.
              */}
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedStudyId}
              onChange={(e) => setSelectedStudyId(e.target.value)}
            >
              <option value="" disabled>Select research...</option>
              {availableToLink.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <Button 
              size="sm" 
              onClick={handleLink} 
              disabled={!selectedStudyId || isLinking}
            >
              {isLinking ? "..." : "Link"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {availableStudies.length === 0 
              ? "No research studies available." 
              : "All available studies linked."}
          </p>
        )}
        
        {availableStudies.length === 0 && (
           <Button variant="link" size="sm" className="px-0 h-auto text-xs" asChild>
             <Link href="/resonance">Create new research</Link>
           </Button>
        )}
      </div>
    </div>
  );
}

