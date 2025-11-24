import React from 'react';
import { PersonaState, PersonaStage } from '@/types/persona';
import { Progress } from '@/components/ui/progress'; // Assuming you have a Progress component, otherwise we can inline

interface PersonaPreviewPanelProps {
  persona: PersonaState | null;
  stage: PersonaStage;
}

export default function PersonaPreviewPanel({ persona, stage }: PersonaPreviewPanelProps) {
  if (!persona) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
        <p>Start chatting on the left to see your persona come to life here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto space-y-8 bg-slate-50 dark:bg-slate-900/50">
      {/* Row 1: Header */}
      <div className="flex gap-6">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-32 h-32 rounded-lg border bg-background overflow-hidden relative">
            <img 
              src={persona.avatar_image_url || "/images/avatar-placeholder.svg"} 
              alt={persona.display_name || "Persona Avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Name and Stats */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{persona.display_name || "Unnamed Persona"}</h2>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
              Agent Stats
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {persona.stats && Object.entries(persona.stats).map(([key, value]) => (
              value !== undefined && (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{key}</span>
                    <span>{value}/100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(Math.max(value || 0, 0), 100)}%` }}
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Goals */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg border-b pb-1">Core Goals</h3>
        {persona.goals && persona.goals.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm pl-2">
            {persona.goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No goals defined yet.</p>
        )}
      </div>

      {/* Row 3: Demographics & Personality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg border-b pb-1">Demographics</h3>
          <dl className="space-y-2 text-sm">
            {persona.demographics && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground font-medium">Age</dt>
                  <dd className="col-span-2">{persona.demographics.age || '-'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground font-medium">Location</dt>
                  <dd className="col-span-2">{persona.demographics.location || '-'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground font-medium">Occupation</dt>
                  <dd className="col-span-2">{persona.demographics.occupation || '-'}</dd>
                </div>
              </>
            )}
            {(!persona.demographics || Object.keys(persona.demographics).length === 0) && (
               <p className="text-muted-foreground italic">No demographics yet.</p>
            )}
          </dl>
        </div>

        {/* Personality */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg border-b pb-1">Personality</h3>
          <div className="space-y-3 text-sm">
             <div>
                <span className="text-muted-foreground font-medium block mb-1">Tone</span>
                <p>{persona.personality?.tone || '-'}</p>
             </div>
             
             {persona.personality?.bigFive && (
               <div className="space-y-2 pt-2">
                 <span className="text-muted-foreground font-medium block">Big Five Traits</span>
                 {Object.entries(persona.personality.bigFive).map(([trait, score]) => (
                   score !== undefined && (
                    <div key={trait} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{trait}</span>
                        <span>{score}/100</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-500" 
                          style={{ width: `${Math.min(Math.max(score || 0, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                   )
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Row 4: Biography */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg border-b pb-1">Biography</h3>
        {persona.biography ? (
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {persona.biography}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Biography pending...</p>
        )}
      </div>
    </div>
  );
}
