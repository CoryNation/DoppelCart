'use client';

import React, { useState, useRef } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { AI_HISTORY_PERSONA_PROMPT } from '@/app/Content/AIHistoryPersonaPrompt';

interface AIHistoryImportFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AIHistoryImportForm({ onBack }: AIHistoryImportFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aiHistoryText, setAiHistoryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyPosition, setCopyPosition] = useState({ x: 0, y: 0 });
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const handleCopyPrompt = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Get button position for animation
    if (copyButtonRef.current) {
      const rect = copyButtonRef.current.getBoundingClientRect();
      setCopyPosition({ x: rect.left + rect.width / 2, y: rect.top - 20 });
    }

    // Build the prompt with name and description prepended
    let promptToCopy = '';
    
    if (name || description) {
      promptToCopy += 'PERSONA CONTEXT:\n';
      if (name) {
        promptToCopy += `Persona Name: ${name}\n`;
      }
      if (description) {
        promptToCopy += `Purpose/Description: ${description}\n`;
      }
      promptToCopy += '\n---\n\n';
    }
    
    promptToCopy += AI_HISTORY_PERSONA_PROMPT.trim();

    try {
      await navigator.clipboard.writeText(promptToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          This tool helps you have one AI reverse-engineer you so another AI can become you. 
          You can optionally add a Persona Name and Description, which will be included in the prompt 
          to better direct and scope the target AI. Once you&apos;ve entered your information, copy the 
          prompt below and paste it into your generative AI tool of choice. The AI will analyze 
          your conversation history and generate a detailed persona profile that captures your 
          thinking style, voice, and communication patterns.
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">
                  AI Prompt to Copy
                </label>
                <Button
                  ref={copyButtonRef}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 relative"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              {copied && (
                <div
                  className="fixed pointer-events-none z-50"
                  style={{
                    left: `${copyPosition.x}px`,
                    top: `${copyPosition.y}px`,
                    transform: 'translate(-50%, -100%)',
                    animation: 'fadeInOut 1s ease-in-out',
                  }}
                >
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium shadow-lg">
                    Copied
                  </div>
                </div>
              )}
              <div className="relative">
                <textarea
                  readOnly
                  value={
                    (name || description
                      ? `PERSONA CONTEXT:\n${name ? `Persona Name: ${name}\n` : ''}${description ? `Purpose/Description: ${description}\n` : ''}\n---\n\n`
                      : '') + AI_HISTORY_PERSONA_PROMPT.trim()
                  }
                  className="w-full h-[100px] rounded-md border border-input bg-surface-container-highest px-3 py-2 text-sm text-text-primary resize-none overflow-y-auto font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Copy this prompt and paste it into your generative AI tool. The prompt includes your Persona Name and Description (if provided) to help guide the analysis.
              </p>
            </div>

            <div>
              <Textarea
                label="AI Reverse Engineered Output"
                placeholder="Paste the output from your AI tool here. This should be the JSON response generated by the AI after analyzing your conversation history."
                value={aiHistoryText}
                onChange={(e) => setAiHistoryText(e.target.value)}
                rows={15}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 200 characters. Paste the complete JSON output from your AI tool after it has analyzed your conversation history.
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
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translate(-50%, -100%) translateY(-10px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -100%) translateY(0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -100%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100%) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

