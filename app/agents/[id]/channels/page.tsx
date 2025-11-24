import React from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { redirect } from 'next/navigation';
import { ChannelSettingsForm } from './ChannelSettingsForm';

// In Next.js 15+, params is a Promise
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentChannelsPage(props: PageProps) {
  const params = await props.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch agent details
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (agentError || !agent) {
    // Handle case where agent doesn't exist or user doesn't have access
    redirect('/dashboard');
  }

  // Verify ownership
  if (agent.user_id !== user.id) {
    redirect('/dashboard');
  }

  // Fetch all available channels
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*');

  if (channelsError) {
    console.error('Error fetching channels:', channelsError);
    return <div>Error loading channels.</div>;
  }

  // Fetch existing agent channels
  const { data: agentChannels, error: agentChannelsError } = await supabase
    .from('agent_channels')
    .select('*')
    .eq('agent_id', params.id);

  if (agentChannelsError) {
    console.error('Error fetching agent channels:', agentChannelsError);
    return <div>Error loading agent configuration.</div>;
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{agent.name} - Channel Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure which platforms this agent will be active on.
        </p>
      </div>

      <ChannelSettingsForm
        agentId={params.id}
        availableChannels={channels || []}
        existingChannels={agentChannels || []}
      />
    </div>
  );
}
