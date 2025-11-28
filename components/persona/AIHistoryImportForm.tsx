'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface AIHistoryImportFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AIHistoryImportForm({ onBack, onSuccess: _onSuccess }: AIHistoryImportFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aiHistoryText, setAiHistoryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!aiHistoryText.trim()) {
      setError('Please provide your AI conversation history.');
      return;
    }

    if (aiHistoryText.trim().length < 200) {
      setError('Please provide at least 200 characters of conversation history.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/personas/from-ai-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || undefined,
          description: description || undefined,
          ai_history_text: aiHistoryText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create persona from AI history');
      }

      const persona = await response.json();
      // Redirect to agent channels page (following existing pattern)
      if (persona.agent_id) {
        window.location.href = `/agents/${persona.agent_id}/channels`;
      } else {
        // Fallback: redirect to personas list
        window.location.href = '/personas';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Method Selection
        </Button>
        <h2 className="text-2xl font-bold">AI History Persona</h2>
        <p className="text-muted-foreground mt-1">
          Paste your ChatGPT, Gemini, or other AI conversation history to create a persona that reflects your thinking style
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Card variant="outlined" padding="lg" className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Persona Name (Optional)"
                placeholder="e.g., My Thinking Style"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                label="Description (Optional)"
                placeholder="What do you want this persona to achieve? e.g., 'Create content that reflects my analytical thinking style'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Textarea
                label="AI Conversation History"
                placeholder="Paste your conversation history from ChatGPT, Gemini, Claude, or any other AI assistant. Include multiple conversations if possible for better results."
                value={aiHistoryText}
                onChange={(e) => setAiHistoryText(e.target.value)}
                rows={15}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 200 characters. The more content you provide, the better the persona will reflect your style.
                <br />
                You can export your history from ChatGPT (Settings → Data Controls → Export), or copy-paste conversations directly.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Characters: {aiHistoryText.length} / 50,000
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !aiHistoryText.trim()} className="flex-1">
                {isLoading ? 'Creating Persona...' : 'Create Persona'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

