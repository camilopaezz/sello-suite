"use client";

import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (detailedPrompt: string) => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === "user";

  if (message.imageData && message.detailedPrompt) {
    const dataUrl = `data:${message.mimeType || "image/png"};base64,${message.imageData}`;

    function handleDownload() {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `nano-banana-${Date.now()}.${(message.mimeType || "png").split("/")[1]}`;
      a.click();
    }

    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] max-w-2xl space-y-3 rounded-2xl rounded-bl-md bg-zinc-800 p-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {message.content}
          </p>
          <img
            src={dataUrl}
            alt="Generated image"
            className="w-full rounded-lg border border-zinc-700"
          />
          <details className="group">
            <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
              Prompt used
            </summary>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              {message.detailedPrompt}
            </p>
          </details>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => onRegenerate?.(message.detailedPrompt!)}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-zinc-800 text-zinc-100 rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
