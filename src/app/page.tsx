"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Message,
  AspectRatio,
  ImageSize,
  Conversation,
  ConversationMeta,
} from "@/lib/types";
import {
  generateId,
  saveConversation,
  loadConversation,
  listConversations,
} from "@/lib/storage";
import { ChatContainer } from "@/components/ChatContainer";
import { PromptInput } from "@/components/PromptInput";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { HistorySidebar } from "@/components/HistorySidebar";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [imageSize, setImageSize] = useState<ImageSize>(1024);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const [conversationId, setConversationId] = useState<string>(generateId);
  const [conversationTitle, setConversationTitle] =
    useState("Nueva conversación");
  const [conversationCreatedAt, setConversationCreatedAt] = useState(Date.now);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationList, setConversationList] = useState<ConversationMeta[]>(
    [],
  );

  const hasGeneratedTitle = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    refreshConversations();
  }, []);

  async function refreshConversations() {
    const list = await listConversations();
    setConversationList(list);
  }

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const conv: Conversation = {
        id: conversationId,
        title: conversationTitle,
        createdAt: conversationCreatedAt || Date.now(),
        updatedAt: Date.now(),
        messages,
        aspectRatio,
        imageSize,
      };
      await saveConversation(conv);
      refreshConversations();
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, conversationId, conversationTitle, conversationCreatedAt, aspectRatio, imageSize]);

  const generateTitle = useCallback(async (userMsgCount: number) => {
    if (!conversationId || userMsgCount < 1) return;
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.filter((m) => m.role === "user"),
        }),
      });
      const data = await res.json();
      if (data.title) {
        setConversationTitle(data.title);
      }
    } catch {
      /* fail silently */
    }
  }, [conversationId, messages]);

  const generateImage = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspectRatio, imageSize }),
        });

        const data = await res.json();

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Error de generación: ${data.error}`,
            },
          ]);
          return;
        }

        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              role: "assistant" as const,
              content: "¡Aquí está tu imagen!",
              imageData: data.image,
              mimeType: data.mimeType,
              detailedPrompt: prompt,
            },
          ];
          return updated;
        });

        if (!hasGeneratedTitle.current) {
          hasGeneratedTitle.current = true;
          generateTitle(messages.filter((m) => m.role === "user").length);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error: No se pudo generar la imagen.",
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    },
    [aspectRatio, imageSize, messages, generateTitle],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const newMessages: Message[] = [...messages, { role: "user", content }];
      setMessages(newMessages);
      setIsChatLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, aspectRatio }),
        });

        const data = await res.json();

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `${data.error}` },
          ]);
          return;
        }

        if (data.type === "ready" && data.detailedPrompt) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.content, detailedPrompt: data.detailedPrompt },
          ]);
          setPendingPrompt(data.detailedPrompt);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.content },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error: No se pudo conectar con el servidor.",
          },
        ]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [messages, aspectRatio, setPendingPrompt],
  );

  const handleApprove = useCallback(async () => {
    if (pendingPrompt) {
      await generateImage(pendingPrompt);
      setPendingPrompt(null);
    }
  }, [pendingPrompt, generateImage]);

  const handleReject = useCallback(() => {
    setPendingPrompt(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Ok, sigamos refinando. Cuéntame qué más te gustaría ajustar.",
      },
    ]);
  }, []);

  const handleRegenerate = useCallback(
    (detailedPrompt: string) => {
      generateImage(detailedPrompt);
    },
    [generateImage],
  );

  async function handleSelectConversation(id: string) {
    if (conversationId && messages.length > 0) {
      const conv: Conversation = {
        id: conversationId,
        title: conversationTitle,
        createdAt: conversationCreatedAt || Date.now(),
        updatedAt: Date.now(),
        messages,
        aspectRatio,
        imageSize,
      };
      await saveConversation(conv);
    }

    const loaded = await loadConversation(id);
    if (loaded) {
      setConversationId(loaded.id);
      setConversationTitle(loaded.title);
      setConversationCreatedAt(loaded.createdAt);
      setMessages(loaded.messages);
      setAspectRatio(loaded.aspectRatio ?? "1:1");
      setImageSize(loaded.imageSize ?? 1024);
      hasGeneratedTitle.current = true;
    }
    refreshConversations();
  }

  async function handleNewChat() {
    if (conversationId && messages.length > 0) {
      const conv: Conversation = {
        id: conversationId,
        title: conversationTitle,
        createdAt: conversationCreatedAt || Date.now(),
        updatedAt: Date.now(),
        messages,
        aspectRatio,
        imageSize,
      };
      await saveConversation(conv);
    }

    const now = Date.now();
    setConversationId(generateId());
    setConversationTitle("Nueva conversación");
    setConversationCreatedAt(now);
    setMessages([]);
    setAspectRatio("1:1");
    setImageSize(1024);
    hasGeneratedTitle.current = false;
    refreshConversations();
  }

  const inputPlaceholder =
    messages.length === 0
      ? "Describe la imagen que quieres crear..."
      : "Haz ajustes...";

  return (
    <div className="flex flex-col h-dvh bg-zinc-950 text-zinc-100">
      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onRefresh={refreshConversations}
      />

      <header className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-zinc-200 text-lg leading-none"
            title="Historial"
          >
            ☰
          </button>
          <span className="text-xl">🍌</span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight truncate">
              {conversationTitle || "Nano Banana Studio"}
            </h1>
          </div>
          <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full ml-auto shrink-0">
            Gemini 3.1 Flash
          </span>
        </div>
      </header>

      <ChatContainer
        messages={messages}
        isLoading={isChatLoading}
        isGenerating={isGenerating}
        pendingPrompt={pendingPrompt}
        onApprove={handleApprove}
        onReject={handleReject}
        onRegenerate={handleRegenerate}
      />

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/80 px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
            />
            <ResolutionSelector
              imageSize={imageSize}
              aspectRatio={aspectRatio}
              onChange={setImageSize}
            />
          </div>
          <PromptInput
            onSend={sendMessage}
            disabled={isChatLoading || isGenerating || !!pendingPrompt}
            placeholder={inputPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
