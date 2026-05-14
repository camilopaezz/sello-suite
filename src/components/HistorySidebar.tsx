"use client";

import { useEffect, useRef } from "react";
import type { ConversationMeta } from "@/lib/types";
import { deleteConversation } from "@/lib/storage";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
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
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Older";
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

export function HistorySidebar({
  open,
  onClose,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRefresh,
}: HistorySidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const groups: GroupedConversations = {};
  for (const conv of conversations) {
    const group = getDateGroup(conv.updatedAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
  }

  const order = ["Today", "Yesterday", "This Week", "Older"];

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteConversation(id);
    onRefresh();
    if (id === activeId) onNewChat();
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-72 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-semibold text-zinc-200">Conversations</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="mx-3 mt-3 mb-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {order.map((group) => {
            const items = groups[group];
            if (!items) return null;
            return (
              <div key={group}>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5 px-1">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelect(conv.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors group ${
                        conv.id === activeId
                          ? "bg-zinc-800"
                          : "hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-md bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {conv.thumbnail ? (
                          <img
                            src={`data:image/png;base64,${conv.thumbnail}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">🍌</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">
                          {conv.title}
                        </p>
                        <p className="text-[10px] text-zinc-600">
                          {formatRelativeTime(conv.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 text-xs"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {conversations.length === 0 && (
            <p className="text-xs text-zinc-600 text-center pt-8">
              No conversations yet
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
