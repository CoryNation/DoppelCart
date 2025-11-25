import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { ResonanceResearchLinker } from "./ResonanceResearchLinker";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch Persona
  const { data: persona, error } = await supabase
    .from("personas")
    .select(`
      *,
      agents!inner(status)
    `)
    .eq("agent_id", params.id) // Assuming params.id is agent_id based on file structure app/agents/[id]
    .single();

  if (error || !persona) {
    // Try fetching by persona id if agent_id fails or if structure is different
    // But based on file path `app/agents/[id]`, `id` is likely the agent UUID.
    console.error("Error fetching persona:", error);
    return notFound();
  }

  // Fetch Linked Research
  const { data: linkedResearch } = await supabase
    .from("resonance_research_personas")
    .select(`
      research_id,
      resonance_research (
        id,
        title,
        created_at
      )
    `)
    .eq("persona_id", persona.id);

  // Fetch all user research for the dropdown
  const { data: allResearch } = await supabase
    .from("resonance_research")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const linkedStudies = linkedResearch?.map(l => l.resonance_research) || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{persona.display_name}</h1>
          <p className="text-muted-foreground mt-1">{persona.biography?.substring(0, 100)}...</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" asChild>
             <Link href={`/agents/${params.id}/channels`}>Manage Channels</Link>
           </Button>
           <Button variant="default">Edit Persona</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Core Identity</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Role</label>
                    <p>{persona.occupation || 'N/A'}</p>
                  </div>
                   <div>
                    <label className="text-xs text-muted-foreground font-semibold uppercase">Industry</label>
                    <p>{persona.industry || 'N/A'}</p>
                  </div>
                </div>
                <div>
                   <label className="text-xs text-muted-foreground font-semibold uppercase">Personality Tone</label>
                   <div className="mt-1">
                     <Badge variant="secondary">{persona.personality?.tone || 'Neutral'}</Badge>
                   </div>
                </div>
                 <div>
                   <label className="text-xs text-muted-foreground font-semibold uppercase">Goals</label>
                   <ul className="list-disc list-inside mt-1 text-sm">
                     {persona.goals?.map((g: string, i: number) => <li key={i}>{g}</li>) || <li>No specific goals set</li>}
                   </ul>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-2 text-sm">
                 {Object.entries(persona.stats || {}).map(([key, val]) => (
                   <div key={key} className="flex justify-between">
                     <span className="capitalize">{key}</span>
                     <span className="font-semibold">{val as number}/100</span>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          {/* Resonance Research Section */}
          <Card>
            <CardHeader>
              <CardTitle>Resonance Research</CardTitle>
            </CardHeader>
            <CardContent>
              <ResonanceResearchLinker 
                personaId={persona.id}
                initialLinkedStudies={linkedStudies}
                availableStudies={allResearch || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

