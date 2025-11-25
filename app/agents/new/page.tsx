import PersonaBuilder from '@/components/persona/PersonaBuilder';
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { ResonanceResearchDetail } from '@/types/resonance'; // We might need to export this type or redefine it
// Wait, I didn't export `ResonanceResearchDetail` from types/resonance.ts, I defined it locally in the page component.
// I should probably move that type to types/resonance.ts or just define a subset here.
// Let's check types/resonance.ts content again.

import { ResonanceResearchResult } from '@/types/resonance';

interface ResonanceContext {
  id: string;
  title: string;
  blueprint: ResonanceResearchResult['persona_blueprint'];
  archetype?: ResonanceResearchResult['winning_persona_archetypes'][0];
}

async function getResonanceContext(id: string): Promise<ResonanceContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('resonance_research')
    .select('id, title, result')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data || !data.result) return null;

  const result = data.result as ResonanceResearchResult;
  
  return {
    id: data.id,
    title: data.title,
    blueprint: result.persona_blueprint,
    archetype: result.winning_persona_archetypes?.[0]
  };
}

export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: { fromResearchId?: string };
}) {
  let resonanceContext: ResonanceContext | null = null;
  
  if (searchParams.fromResearchId) {
    resonanceContext = await getResonanceContext(searchParams.fromResearchId);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center h-16 px-6 border-b shrink-0 justify-between">
        <h1 className="text-lg font-semibold">Create Your Agent</h1>
        {resonanceContext && (
           <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
             Based on Resonance Research: <span className="font-medium text-foreground">{resonanceContext.title}</span>
           </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <PersonaBuilder resonanceContext={resonanceContext} />
      </main>
    </div>
  );
}
