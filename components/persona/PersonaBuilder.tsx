'use client';

import React, { useState } from 'react';
import { PersonaState, ChatMessage } from '@/types/persona';
import PersonaChatPanel from './PersonaChatPanel';
import PersonaPreviewPanel from './PersonaPreviewPanel';
import { Button } from '@/components/ui/button';
import { savePersonaAction } from '@/app/agents/new/actions';

const MAX_MESSAGES_FOR_MODEL = 12;

export default function PersonaBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hey! Let's design your social persona. First: what is this persona mainly for? (e.g., grow an audience around AI, promote a product, rally people to a cause, etc.)",
    },
  ]);
  const [persona, setPersona] = useState<PersonaState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, startTransition] = React.useTransition();
  const [assistantTurns, setAssistantTurns] = useState(0);

  const TURN_LIMIT = 20;

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return;

    if (assistantTurns >= TURN_LIMIT) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content },
        {
          role: 'assistant',
          content: "You’ve reached the free refinement limit for this persona. Save your agent or upgrade to continue refining."
        },
      ]);
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content },
    ];

    const trimmedMessages = nextMessages.slice(-MAX_MESSAGES_FOR_MODEL);

    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/persona-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: trimmedMessages,
          currentPersona: persona,
          assistantTurns: assistantTurns,
          maxAssistantTurns: TURN_LIMIT,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      setPersona(data.updatedPersona);
      setAssistantTurns((prev) => prev + 1);
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.assistantReply },
      ]);
    } catch (error) {
      console.error('Error in persona builder:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error while processing that. Could you try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!persona) return;
    startTransition(() => {
      savePersonaAction(persona);
    });
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Chat */}
      <div className="w-1/2 border-r border-border">
        <PersonaChatPanel
          messages={messages}
          onSend={handleUserMessage}
          isLoading={isLoading}
          isDisabled={assistantTurns >= TURN_LIMIT}
        />
      </div>

      {/* Right Panel: Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <PersonaPreviewPanel persona={persona} />
        </div>
        <div className="p-4 border-t bg-background">
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={!persona || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Persona & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
