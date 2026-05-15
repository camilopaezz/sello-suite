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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    <div className="relative flex h-dvh flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(253,224,71,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute -z-10 right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute -z-10 bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.12),transparent_60%)]" />
      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onRefresh={refreshConversations}
      />

      <header className="shrink-0 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            title="Historial"
          >
            ☰
          </Button>
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-lg">
            🍌
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight">
              {conversationTitle || "Nano Banana Studio"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Estudio de prompts y generación
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            Gemini 3.1 Flash
          </Badge>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-[70vh] flex-col">
              <ChatContainer
                messages={messages}
                isLoading={isChatLoading}
                isGenerating={isGenerating}
                pendingPrompt={pendingPrompt}
                onApprove={handleApprove}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
              />

              <div className="mt-4 space-y-3 lg:hidden">
                <Card className="w-full border border-border/80 bg-card/95 py-0 shadow-lg">
                  <div className="flex flex-col gap-4 px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Ajustes de generación
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Define formato y tamaño antes de generar.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                  </div>
                </Card>
              </div>

            </div>

            <aside className="hidden lg:flex">
              <Card className="sticky top-24 h-fit w-full border border-border/80 bg-card/95 py-0 shadow-lg">
                <div className="flex flex-col gap-4 px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Ajustes de generación
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Define formato y tamaño antes de generar.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
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
                </div>
              </Card>
            </aside>
          </div>

          <div className="mt-4">
            <PromptInput
              onSend={sendMessage}
              disabled={isChatLoading || isGenerating || !!pendingPrompt}
              placeholder={inputPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
