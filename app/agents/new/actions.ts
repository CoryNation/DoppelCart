'use server';

import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { PersonaState } from '@/types/persona';
import { redirect } from 'next/navigation';

export async function savePersonaAction(persona: PersonaState, resonanceResearchId?: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Insert into agents table
  const { data: agentData, error: agentError } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name: persona.display_name || 'Untitled Agent',
      primary_goal: persona.goals?.[0] || null,
      status: 'draft',
    })
    .select('id')
    .single();

  if (agentError) {
    console.error('Error creating agent:', agentError);
    throw new Error('Failed to create agent');
  }

  const agentId = agentData.id;

  // Insert into personas table
  const { data: personaData, error: personaError } = await supabase.from('personas').insert({
    agent_id: agentId,
    display_name: persona.display_name,
    avatar_image_url: persona.avatar_image_url,
    avatar_prompt: persona.avatar_prompt,
    stats: persona.stats,
    goals: persona.goals,
    demographics: persona.demographics,
    personality: persona.personality,
    biography: persona.biography,
    raw_definition: JSON.stringify(persona),
  }).select('id').single();

  if (personaError || !personaData) {
    console.error('Error creating persona:', personaError);
    // Cleanup agent if persona creation fails
    await supabase.from('agents').delete().eq('id', agentId);
    throw new Error('Failed to create persona record');
  }

  // If we have a resonance research ID, link it
  if (resonanceResearchId) {
    const { error: linkError } = await supabase
      .from('resonance_research_personas')
      .upsert(
        {
          research_id: resonanceResearchId,
          persona_id: personaData.id,
        },
        { onConflict: "research_id, persona_id" }
      );

    if (linkError) {
      console.error('Error linking persona to resonance research:', linkError);
      // We don't fail the whole request if linking fails, just log it.
    }
  }

  redirect(`/agents/${agentId}/channels`);
}
