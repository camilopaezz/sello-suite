"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isGenerating: boolean;
  onRegenerate: (detailedPrompt: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  isGenerating,
  onRegenerate,
}: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isGenerating]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        <div className="text-center space-y-2">
          <div className="text-4xl">🍌</div>
          <p className="text-lg font-medium">Nano Banana Studio</p>
          <p className="text-sm text-zinc-600 max-w-md">
            Describe the image you want to create. I&apos;ll ask a few questions
            to refine your idea, then generate it with Gemini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 px-4 py-6">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} onRegenerate={onRegenerate} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      )}
      {isGenerating && (
        <div className="flex justify-start">
          <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
              Generating image...
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
