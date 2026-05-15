"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGenerating: boolean;
  pendingPrompt: string | null;
  onApprove: () => void;
  onReject: () => void;
  onRegenerate: (detailedPrompt: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  isGenerating,
  pendingPrompt,
  onApprove,
  onReject,
  onRegenerate,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isGenerating]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-xl border border-border/60 bg-card/70 py-0 shadow-sm">
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-3xl">
              🍌
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold">Nano Banana Studio</p>
              <p className="text-sm text-muted-foreground">
                Describe la imagen que quieres crear. Haré algunas preguntas
                para refinar tu idea y la generaré con Gemini.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-6 pb-24 sm:pb-28">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const showApproval = !!(
            isLast && pendingPrompt && msg.detailedPrompt === pendingPrompt
          );
          return (
            <ChatMessage
              key={i}
              message={msg}
              showApproval={showApproval}
              onApprove={onApprove}
              onReject={onReject}
              onRegenerate={onRegenerate}
            />
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="rounded-2xl rounded-bl-md border border-border/70 bg-muted/60 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0.1s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0.2s]" />
              </div>
            </Card>
          </div>
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <Card className="rounded-2xl rounded-bl-md border border-border/70 bg-muted/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
                Generando imagen...
              </div>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
