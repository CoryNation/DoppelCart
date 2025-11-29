'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, ArrowLeft } from 'lucide-react';

interface CSVImportFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function CSVImportForm({ onBack }: CSVImportFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platformHint, setPlatformHint] = useState('');
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Read file as text
    try {
      const text = await selectedFile.text();
      setCsvText(text);
    } catch (err) {
      setError('Failed to read file. Please try again.');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!csvText.trim()) {
      setError('Please provide CSV text or upload a file.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/personas/from-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || undefined,
          description: description || undefined,
          platform_hint: platformHint || undefined,
          csv_text: csvText,
          original_filename: file?.name || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create persona from CSV');
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
        <h2 className="text-2xl font-bold">Digital Twin from CSV</h2>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file with your social media posts or comments to create a persona that matches your voice
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Card variant="outlined" padding="lg" className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Persona Name (Optional)"
                placeholder="e.g., My LinkedIn Voice"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Textarea
                label="Description (Optional)"
                placeholder="What do you want this persona to achieve? e.g., 'Create engaging tech content for LinkedIn'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Input
                label="Platform Hint (Optional)"
                placeholder="e.g., linkedin, x, reddit"
                value={platformHint}
                onChange={(e) => setPlatformHint(e.target.value)}
                helperText="Which platform are these posts from?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                CSV File or Text
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Or paste your CSV content directly below
                </p>
              </div>
            </div>

            <div>
              <Textarea
                label="CSV Content"
                placeholder="Paste your CSV content here, or upload a file above. The CSV should contain columns with text content (posts, comments, etc.)"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The system will automatically extract text from columns like &quot;text&quot;, &quot;content&quot;, &quot;post&quot;, &quot;comment&quot;, &quot;body&quot;, or &quot;title&quot;
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
              <Button type="submit" disabled={isLoading || !csvText.trim()} className="flex-1">
                {isLoading ? 'Creating Persona...' : 'Create Persona'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

