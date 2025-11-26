"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import Card from "@/components/ui/card";

type Step = "TITLE_DESC" | "CHAT" | "RUNNING";
type Role = "system" | "assistant" | "user";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
}

interface NewResearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewResearchModal({ open, onClose }: NewResearchModalProps) {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("TITLE_DESC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clarifiedScope, setClarifiedScope] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, unknown> | null>(null);
  const [userInput, setUserInput] = useState("");
  const [researchId, setResearchId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("TITLE_DESC");
      setTitle("");
      setDescription("");
      setSummary(null);
      setMessages([]);
      setClarifiedScope(null);
      setParameters(null);
      setUserInput("");
      setResearchId(null);
      setProgress(0);
      setIsLoading(false);
      setError(null);
    }
  }, [open]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (step === "CHAT" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, step]);

  // Polling logic for RUNNING step with retry and exponential backoff
  useEffect(() => {
    if (step !== "RUNNING" || !researchId) return;

    let attempts = 0;
    let consecutiveFailures = 0;
    let isMounted = true;
    const maxAttempts = 60; // ~2-3 minutes max
    const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures
    const baseInterval = 2500; // Base polling interval in ms

    const poll = async (retryDelay = 0) => {
      if (!isMounted) return;
      // Apply retry delay for exponential backoff
      if (retryDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }

      attempts++;
      
      // Simulate progress movement (only if not near completion)
      if (isMounted) {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return Math.min(prev + 5, 95);
        });
      }

      try {
        const res = await fetch(`/api/research/status?id=${researchId}`);
        
        if (!res.ok) {
          consecutiveFailures++;
          
          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 4000);
          
          if (consecutiveFailures >= maxConsecutiveFailures) {
            clearInterval(intervalId);
            setError("Failed to check research status after multiple attempts. Please check the research page manually.");
            return;
          }
          
          // Retry with exponential backoff
          setTimeout(() => poll(backoffDelay), backoffDelay);
          return;
        }

        // Reset failure counter on success
        consecutiveFailures = 0;

        const data = await res.json();
        if (!isMounted) return;
        
        setProgress(data.progress || 0);

        if (data.status === "completed") {
          clearInterval(intervalId);
          if (isMounted) {
            setProgress(100);
            setTimeout(() => {
              if (isMounted) {
                onClose();
                router.push(`/resonance-research/${researchId}`);
              }
            }, 800);
          }
        } else if (data.status === "failed") {
          clearInterval(intervalId);
          if (isMounted) {
            setError(data.statusMessage || "Research failed. Please try again.");
            setStep("CHAT");
          }
        } else {
          // Still running, continue polling
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            if (isMounted) {
              setError("Research is taking longer than expected. Please check back later.");
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Polling error:", err);
        consecutiveFailures++;
        
        // Exponential backoff on network errors
        const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 4000);
        
        if (consecutiveFailures >= maxConsecutiveFailures || attempts >= maxAttempts) {
          clearInterval(intervalId);
          if (isMounted) {
            setError("Failed to check research status. Please check the research page manually.");
          }
          return;
        }
        
        // Retry with exponential backoff
        setTimeout(() => {
          if (isMounted) {
            poll(backoffDelay);
          }
        }, backoffDelay);
      }
    };

    const intervalId = setInterval(() => {
      if (isMounted) {
        poll();
      }
    }, baseInterval);
    // Start polling immediately
    poll();

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [step, researchId, onClose, router]);

  // Step 1: Start Investigation
  const handleStartInvestigation = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/research/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate clarifying questions");
      }

      const data = await res.json();
      setSummary(data.summary);

      // Create initial assistant message
      const content = `${data.summary}\n\nHere are a few questions to clarify your research:\n\n${data.initialQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages([assistantMessage]);
      setStep("CHAT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Send user answer and finalize scope
  const handleSendAnswer = async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userInput,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/research/clarify/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to finalize research scope");
      }

      const data = await res.json();
      setClarifiedScope(data.clarifiedScope);
      setParameters(data.parameters);

      const assistantReply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.assistantMessage,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Execute Research
  const handleExecuteResearch = async () => {
    if (!clarifiedScope || messages.filter((m) => m.role === "user").length === 0) {
      setError("Please answer the questions before executing research");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/research/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          clarifiedScope,
          parameters,
          messages: messages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start research");
      }

      const data = await res.json();
      setResearchId(data.researchId);
      setStep("RUNNING");
      setProgress(10);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const hasUserMessages = messages.some((m) => m.role === "user");
  const canExecute = hasUserMessages && clarifiedScope !== null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="lg"
      title={
        step === "TITLE_DESC"
          ? "Step 1 of 2 · Define your research idea"
          : step === "CHAT"
          ? "Step 2 of 2 · Refine your research scope"
          : "Running your research…"
      }
    >
      <div className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Title & Description */}
        {step === "TITLE_DESC" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a title and description for your research. We&apos;ll ask a few clarifying
              questions to ensure we scope this correctly.
            </p>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Sustainable Fashion Blog Strategy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your goals, target audience, and what you want to achieve..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="min-h-[120px]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Chat */}
        {step === "CHAT" && (
          <div className="space-y-4">
            {/* Summary card */}
            <Card className="p-4 bg-muted/30">
              <div className="space-y-2">
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {description}
                </div>
                {summary && (
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    {summary}
                  </div>
                )}
              </div>
            </Card>

            {/* Chat area */}
            <div className="border rounded-lg p-4 h-[300px] overflow-y-auto space-y-4 bg-muted/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">You</span>
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 text-sm max-w-[80%] ${
                      msg.role === "assistant"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 text-sm bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* User input */}
            <div className="space-y-2">
              <Textarea
                placeholder="Answer the questions or add more context..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendAnswer();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <Button
                  onClick={handleSendAnswer}
                  disabled={!userInput.trim() || isLoading}
                  size="sm"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Running */}
        {step === "RUNNING" && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 text-center max-w-sm">
                <h3 className="text-lg font-medium">Analyzing…</h3>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  This is a stubbed status for now. Research is being processed...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        {step === "TITLE_DESC" && (
          <>
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleStartInvestigation}
              disabled={!title.trim() || !description.trim() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Investigation
            </Button>
          </>
        )}

        {step === "CHAT" && (
          <>
            <Button
              variant="ghost"
              onClick={() => setStep("TITLE_DESC")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleExecuteResearch}
                disabled={!canExecute || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Execute Research
              </Button>
            </div>
          </>
        )}

        {step === "RUNNING" && (
          <div className="w-full text-center">
            <p className="text-xs text-muted-foreground">
              This may take a few moments...
            </p>
          </div>
        )}
      </ModalFooter>
    </Modal>
  );
}

