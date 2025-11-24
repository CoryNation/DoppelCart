'use server';

import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { PersonaState } from '@/types/persona';
import { redirect } from 'next/navigation';

export async function savePersonaAction(persona: PersonaState) {
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
  const { error: personaError } = await supabase.from('personas').insert({
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
  });

  if (personaError) {
    console.error('Error creating persona:', personaError);
    // Cleanup agent if persona creation fails
    await supabase.from('agents').delete().eq('id', agentId);
    throw new Error('Failed to create persona record');
  }

  redirect(`/agents/${agentId}/channels`);
}

