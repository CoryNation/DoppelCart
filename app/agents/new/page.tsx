import PersonaBuilder from '@/components/persona/PersonaBuilder';

export default function NewAgentPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center h-16 px-6 border-b shrink-0">
        <h1 className="text-lg font-semibold">Create Your Agent</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <PersonaBuilder />
      </main>
    </div>
  );
}

