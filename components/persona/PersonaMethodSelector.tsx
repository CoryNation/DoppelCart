'use client';

import React from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { MessageSquare, FileSpreadsheet, History } from 'lucide-react';

export type PersonaCreationMethod = 'ai_chat' | 'digital_twin_csv' | 'ai_history_import';

interface PersonaMethodSelectorProps {
  onSelectMethod: (method: PersonaCreationMethod) => void;
}

export default function PersonaMethodSelector({ onSelectMethod }: PersonaMethodSelectorProps) {
  const methods = [
    {
      id: 'ai_chat' as PersonaCreationMethod,
      title: 'AI Chat Builder',
      description: 'Build your persona through an interactive conversation with AI',
      icon: <MessageSquare className="h-8 w-8" />,
      features: ['Interactive Q&A', 'Step-by-step refinement', 'Full control over details'],
    },
    {
      id: 'digital_twin_csv' as PersonaCreationMethod,
      title: 'Digital Twin from CSV',
      description: 'Create a persona based on your social media post history',
      icon: <FileSpreadsheet className="h-8 w-8" />,
      features: ['Upload CSV of posts/comments', 'AI analyzes your voice', 'Automatic persona generation'],
    },
    {
      id: 'ai_history_import' as PersonaCreationMethod,
      title: 'AI History Persona',
      description: 'Generate a persona from your ChatGPT, Gemini, or other AI conversation history',
      icon: <History className="h-8 w-8" />,
      features: ['Paste conversation history', 'AI extracts your thinking style', 'Creates authentic persona'],
    },
  ];

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-background">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Your Persona</h1>
          <p className="text-muted-foreground">
            Choose how you&apos;d like to create your AI influencer persona
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {methods.map((method) => (
            <Card
              key={method.id}
              variant="outlined"
              padding="lg"
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectMethod(method.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-primary">{method.icon}</div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                </div>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {method.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMethod(method.id);
                  }}
                >
                  Choose This Method
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

