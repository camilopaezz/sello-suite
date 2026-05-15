"use client";

import Image from "next/image";
import type { ConversationMeta } from "@/lib/types";
import { deleteConversation } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days}d`;
  return new Date(ts).toLocaleDateString();
}

function getDateGroup(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const diffDays = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) /
      86400000
  );
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return "Esta semana";
  return "Anterior";
}

interface GroupedConversations {
  [group: string]: ConversationMeta[];
}

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRefresh: () => void;
}

interface HistorySidebarPanelProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRefresh: () => void;
  className?: string;
}

interface SidebarContentProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRefresh: () => void;
  onItemSelected?: () => void;
  className?: string;
}

function SidebarContent({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRefresh,
  onItemSelected,
  className,
}: SidebarContentProps) {
  const groups: GroupedConversations = {};
  for (const conv of conversations) {
    const group = getDateGroup(conv.updatedAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
  }

  const order = ["Hoy", "Ayer", "Esta semana", "Anterior"];

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteConversation(id);
    onRefresh();
    if (id === activeId) onNewChat();
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-col gap-0.5 p-4">
        <h2 className="text-sm font-semibold">Conversaciones</h2>
        <p className="text-xs text-muted-foreground">Tu historial reciente</p>
      </div>
      <Separator />

      <div className="px-4 pt-3">
        <Button
          onClick={() => {
            onNewChat();
            onItemSelected?.();
          }}
          className="w-full"
        >
          + Nueva conversación
        </Button>
      </div>

      <ScrollArea className="mt-3 flex-1 px-4 pb-4">
        <div className="space-y-4">
          {order.map((group) => {
            const items = groups[group];
            if (!items) return null;
            return (
              <div key={group}>
                <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                <div className="space-y-1">
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelect(conv.id);
                        onItemSelected?.();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSelect(conv.id);
                          onItemSelected?.();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        conv.id === activeId
                          ? "bg-muted"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/50">
                        {conv.thumbnail ? (
                          <Image
                            src={`data:image/png;base64,${conv.thumbnail}`}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-sm">🍌</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {conv.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(conv.updatedAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="Eliminar"
                      >
                        🗑
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {conversations.length === 0 && (
            <p className="pt-8 text-center text-xs text-muted-foreground">
              Sin conversaciones aún
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function HistorySidebar({
  open,
  onClose,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRefresh,
}: HistorySidebarProps) {
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent side="left" className="w-80 gap-0 p-0">
        <SidebarContent
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onNewChat={onNewChat}
          onRefresh={onRefresh}
          onItemSelected={onClose}
        />
      </SheetContent>
    </Sheet>
  );
}

export function HistorySidebarPanel({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRefresh,
  className,
}: HistorySidebarPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-lg",
        className
      )}
    >
      <SidebarContent
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onNewChat={onNewChat}
        onRefresh={onRefresh}
      />
    </div>
  );
}
