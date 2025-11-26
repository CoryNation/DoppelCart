"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Sparkles, ArrowLeft, RotateCw } from "lucide-react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

type Step = "TITLE_DESC" | "CHAT" | "RUNNING";

interface NewResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

export default function NewResearchModal({ isOpen, onClose, onSuccess }: NewResearchModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("TITLE_DESC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userResponse, setUserResponse] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [researchId, setResearchId] = useState<string | null>(null);
  const [initialSummary, setInitialSummary] = useState<string | null>(null);
  
  // Scroll to bottom of chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === "CHAT") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, step]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      // Wait for animation if necessary, but simple reset is fine
      setTimeout(() => {
        setStep("TITLE_DESC");
        setTitle("");
        setDescription("");
        setMessages([]);
        setUserResponse("");
        setProgress(0);
        setResearchId(null);
        setInitialSummary(null);
      }, 300);
    }
  }, [isOpen]);

  // Step 1 -> Step 2
  const handleStartInvestigation = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/research/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) throw new Error("Failed to generate questions");

      const data = await res.json();
      setInitialSummary(data.summary);
      const questionBlock = (data.initialQuestions || [])
        .map((q: string, index: number) => `${index + 1}. ${q}`)
        .join("\n");

      setMessages([
        {
          role: "assistant",
          content: `${data.summary}\n\nTo refine the scope, I have a few questions:\n\n${questionBlock}`,
        },
      ]);

      setStep("CHAT");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send user reply in chat
  const handleSendReply = () => {
    if (!userResponse.trim()) return;

    const reply = userResponse;
    setUserResponse("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: reply },
      {
        role: "assistant",
        content:
          "Thanks for the extra detail. Share more if needed, or execute the research when you're ready.",
      },
    ]);
  };

  // Step 2 -> Step 3 (Execute)
  const handleExecuteResearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/research/clarify/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, messages }),
      });

      if (!res.ok) throw new Error("Failed to finalize research scope");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistantMessage },
      ]);

      await executeResearch(data.clarifiedScope, data.parameters);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const executeResearch = async (
    clarifiedScope: string,
    parameters: Record<string, unknown>
  ) => {
    setStep("RUNNING");
    setStatusMessage("Initializing research agent...");
    setProgress(5);

    try {
      const chatTranscript = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const initialPrompt = `Clarified Scope:\n${clarifiedScope}\n\nParameters:\n${JSON.stringify(
        parameters,
        null,
        2
      )}`;

      const res = await fetch("/api/resonance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          initial_prompt: initialPrompt,
          input_context: {
            title,
            description,
            clarifiedScope,
            parameters,
            chatTranscript: messages,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to start research");

      const data = await res.json();
      setResearchId(data.id);
      setIsLoading(false);
      pollStatus(data.id);
    } catch (error) {
      console.error(error);
      setStep("CHAT");
      setIsLoading(false);
    }
  };

  const pollStatus = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout approx if 1s interval
    const interval = setInterval(async () => {
      attempts++;
      
      // Simulated progress for better UX while waiting
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10; 
      });

      try {
        const res = await fetch(`/api/resonance/${id}`);
        if (res.ok) {
          const data = await res.json();
          
          if (data.status === "completed") {
            clearInterval(interval);
            setProgress(100);
            setStatusMessage("Research complete!");
            setTimeout(() => {
              onClose();
              if (onSuccess) onSuccess();
              router.push(`/resonance/${id}`);
            }, 800);
          } else if (data.status === "failed") {
            clearInterval(interval);
            // Handle error state
            setStatusMessage("Research failed. Please try again.");
            setStep("CHAT"); 
          } else {
            setStatusMessage("Analyzing market data...");
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Timeout behavior
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold">New Resonance Research</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === "TITLE_DESC" && "Step 1 of 2 – Define your research idea"}
              {step === "CHAT" && "Step 2 of 2 – Refine your research scope"}
              {step === "RUNNING" && "Running Research..."}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={step === "RUNNING"}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {step === "TITLE_DESC" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g. Sustainable Fashion Blog Strategy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="desc"
                  className="min-h-[120px]"
                  placeholder="Describe your goals, target audience, and what you want to achieve..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === "CHAT" && (
            <div className="flex flex-col h-full gap-4">
              <div className="bg-muted/30 p-3 rounded-md text-sm border space-y-1">
                <div className="font-medium text-foreground">{title}</div>
                <div className="text-muted-foreground">{description}</div>
                <p className="text-xs text-muted-foreground">
                  We’ll ask a few quick questions to make sure this research is scoped correctly.
                </p>
                {initialSummary && (
                  <p className="text-xs text-muted-foreground">
                    Summary: {initialSummary}
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] p-1">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {msg.role === "assistant" ? <Sparkles className="h-4 w-4" /> : "You"}
                    </div>
                    <div className={`rounded-lg p-3 text-sm max-w-[85%] ${
                      msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="pt-2">
                <Textarea 
                  placeholder="Answer the questions or add more context..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  className="min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">Press Enter to chat</p>
              </div>
            </div>
          )}

          {step === "RUNNING" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RotateCw className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-medium">{statusMessage}</h3>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  We are scanning your inputs and generating persona archetypes...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex justify-between items-center">
          {step === "TITLE_DESC" && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleStartInvestigation} 
                disabled={!title || !description || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Investigation
              </Button>
            </>
          )}

          {step === "CHAT" && (
            <>
              <Button variant="ghost" onClick={() => setStep("TITLE_DESC")} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSendReply} disabled={!userResponse.trim() || isLoading}>
                  Reply
                </Button>
                <Button onClick={handleExecuteResearch} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Execute Research
                </Button>
              </div>
            </>
          )}

          {step === "RUNNING" && (
            <div className="w-full flex justify-center">
              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

