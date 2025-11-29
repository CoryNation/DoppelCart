'use client';

import React, { useState } from 'react';
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Sparkles } from 'lucide-react';
import LinkedInAnalysisResults from './LinkedInAnalysisResults';

interface AnalysisResult {
  core_drivers: {
    intrinsic: string[];
    extrinsic: string[];
  };
  cultivated_persona: string;
  definition_of_success: string;
  guiding_values: string[];
  interests_and_growth: {
    key_interests: string[];
    passions: string[];
    growth_areas: string[];
  };
}

export default function LinkedInPersonaAnalysisClient() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showExtensionInfo, setShowExtensionInfo] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setCsvFile(selectedFile);
    setError(null);

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
    setAnalysisResult(null);

    if (!csvText.trim()) {
      setError('Please upload a CSV file or paste CSV content.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for this analysis.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/linkedin-persona-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          csv_text: csvText,
          original_filename: csvFile?.name || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze LinkedIn data');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LinkedIn Persona Analysis</h1>
        <p className="text-text-secondary">
          Analyze LinkedIn profile data to understand core drivers, values, and persona insights
        </p>
      </div>

      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card variant="elevated" padding="lg">
              <CardHeader>
                <CardTitle>Upload LinkedIn Data</CardTitle>
                <CardDescription>
                  Upload CSV files exported from the LinkedIn Persona Miner extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      label="Analysis Title *"
                      placeholder="e.g., Analysis of John Doe's LinkedIn Profile"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Textarea
                      label="Description (Optional)"
                      placeholder="What are you looking to achieve with this analysis? e.g., 'Understand their motivations to better engage with them'"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      LinkedIn CSV Data *
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".csv"
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
                      placeholder="Paste your CSV content here, or upload a file above. Should contain LinkedIn posts and/or comments data."
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={10}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The CSV should contain columns like &quot;text&quot;, &quot;post_url&quot;, &quot;created_time_iso&quot;, etc.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowExtensionInfo(!showExtensionInfo)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Get Extension
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !csvText.trim() || !title.trim()}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze Persona
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Extension Info Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="outlined" padding="lg">
              <CardHeader>
                <CardTitle>LinkedIn Persona Miner</CardTitle>
                <CardDescription>
                  Browser extension to extract LinkedIn profile data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">How to Use:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
                    <li>Install the Chrome extension</li>
                    <li>Navigate to a LinkedIn profile</li>
                    <li>Open the extension popup</li>
                    <li>Download resume PDF and activity CSV</li>
                    <li>Upload the CSV files here</li>
                  </ol>
                </div>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowExtensionInfo(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Installation Instructions
                </Button>

                {showExtensionInfo && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3 text-sm">
                    <h4 className="font-semibold">Installation Steps:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-text-secondary">
                      <li>Go to <code className="bg-background px-1 rounded">chrome://extensions</code></li>
                      <li>Enable <strong>Developer mode</strong> (top right)</li>
                      <li>Click <strong>Load unpacked</strong></li>
                      <li>Select the <code className="bg-background px-1 rounded">linkedin-persona-miner</code> folder</li>
                      <li>Pin the extension to your toolbar</li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">
                      The extension folder is located at: <code className="bg-background px-1 rounded">linkedin-persona-miner/</code>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <LinkedInAnalysisResults
          title={title}
          description={description}
          analysis={analysisResult}
          onBack={() => {
            setAnalysisResult(null);
            setTitle('');
            setDescription('');
            setCsvText('');
            setCsvFile(null);
          }}
        />
      )}
    </div>
  );
}

