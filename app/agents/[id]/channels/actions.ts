'use server';

import { createSupabaseServerClient } from '@/lib/supabase/serverClient';
import { revalidatePath } from 'next/cache';

export interface ChannelConfig {
  channel_id: string;
  enabled: boolean;
  account_handle?: string;
  account_url?: string;
}

export async function saveAgentChannels(agentId: string, configs: ChannelConfig[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const { data: agent } = await supabase
    .from('agents')
    .select('user_id')
    .eq('id', agentId)
    .single();

  if (!agent || agent.user_id !== user.id) {
    throw new Error('Unauthorized access to agent');
  }

  // Process updates
  for (const config of configs) {
    if (config.enabled) {
      // Upsert enabled channel
      await supabase.from('agent_channels').upsert({
        agent_id: agentId,
        channel_id: config.channel_id,
        account_handle: config.account_handle,
        account_url: config.account_url,
        is_active: true,
      }, { onConflict: 'agent_id, channel_id' });
    } else {
      // Delete disabled channel (or mark inactive if you prefer soft delete, but prompt said "delete existing row")
      await supabase
        .from('agent_channels')
        .delete()
        .match({ agent_id: agentId, channel_id: config.channel_id });
    }
  }

  revalidatePath(`/agents/${agentId}/channels`);
}






