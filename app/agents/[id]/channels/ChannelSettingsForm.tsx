'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { saveAgentChannels, ChannelConfig } from './actions';

interface Channel {
  id: string;
  name: string;
  platform_key: string;
}

interface AgentChannel {
  id: string;
  agent_id: string;
  channel_id: string;
  account_handle?: string;
  account_url?: string;
}

interface ChannelSettingsFormProps {
  agentId: string;
  availableChannels: Channel[];
  existingChannels: AgentChannel[];
}

export function ChannelSettingsForm({
  agentId,
  availableChannels,
  existingChannels,
}: ChannelSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<Record<string, ChannelConfig>>(() => {
    const initial: Record<string, ChannelConfig> = {};
    availableChannels.forEach((channel) => {
      const existing = existingChannels.find((ec) => ec.channel_id === channel.id);
      initial[channel.id] = {
        channel_id: channel.id,
        enabled: !!existing,
        account_handle: existing?.account_handle || '',
        account_url: existing?.account_url || '',
      };
    });
    return initial;
  });

  const handleToggle = (channelId: string, enabled: boolean) => {
    setConfigs((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], enabled },
    }));
  };

  const handleUpdate = (channelId: string, field: 'account_handle' | 'account_url', value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], [field]: value },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveAgentChannels(agentId, Object.values(configs));
        // Optional: Add toast success here
      } catch (error) {
        console.error('Failed to save channels:', error);
        // Optional: Add toast error here
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {availableChannels.map((channel) => {
          const config = configs[channel.id];
          return (
            <div
              key={channel.id}
              className={`p-4 rounded-lg border transition-colors ${
                config.enabled ? 'bg-card border-primary/50' : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Placeholder icon logic */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {channel.name[0]}
                  </div>
                  <h3 className="font-semibold text-lg">{channel.name}</h3>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleToggle(channel.id, checked)}
                />
              </div>

              {config.enabled && (
                <div className="grid gap-4 md:grid-cols-2 pl-11">
                  <div className="space-y-2">
                    <Label htmlFor={`${channel.id}-handle`}>Account Handle</Label>
                    <Input
                      id={`${channel.id}-handle`}
                      placeholder="@username"
                      value={config.account_handle}
                      onChange={(e) => handleUpdate(channel.id, 'account_handle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${channel.id}-url`}>Profile URL</Label>
                    <Input
                      id={`${channel.id}-url`}
                      placeholder={`https://${channel.platform_key.toLowerCase()}.com/...`}
                      value={config.account_url}
                      onChange={(e) => handleUpdate(channel.id, 'account_url', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? 'Saving Changes...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}

