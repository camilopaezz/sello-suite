import type { Conversation, ConversationMeta, ExportData } from "./types";

const DB_NAME = "NanoBananaStudio";
const STORE_NAME = "conversations";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function saveConversation(conv: Conversation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(conv);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadConversation(
  id: string
): Promise<Conversation | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function importConversations(
  conversations: Conversation[]
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    let count = 0;
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
    for (const conv of conversations) {
      const request = tx.objectStore(STORE_NAME).put(conv);
      request.onsuccess = () => {
        count++;
      };
    }
  });
}

export function exportToJsonFile(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nano-banana-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function listConversations(): Promise<ConversationMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const all: Conversation[] = request.result ?? [];
      const meta: ConversationMeta[] = all
        .filter((c) => c.messages && c.messages.length > 0)
        .map((c) => {
          const imgMsg = c.messages.find((m) => m.imageData);
          return {
            id: c.id,
            title: c.title || "New Chat",
            createdAt: c.createdAt ?? 0,
            updatedAt: c.updatedAt ?? 0,
            thumbnail: imgMsg?.imageData,
          };
        });
      meta.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(meta);
    };
    request.onerror = () => reject(request.error);
  });
}
