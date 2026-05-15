export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
  imageData?: string;
  mimeType?: string;
  detailedPrompt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface ChatRequest {
  messages: Message[];
  aspectRatio: AspectRatio;
}

export interface ChatResponse {
  type: "question" | "ready";
  content: string;
  detailedPrompt?: string;
}

export interface GenerateRequest {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface GenerateResponse {
  image: string;
  mimeType: string;
}

export type AspectRatio =
  | "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
  | "1:4" | "4:1" | "1:8" | "8:1";

export type ImageSize = 512 | 1024 | 2048 | 4096;

export interface AspectRatioOption {
  label: string;
  value: AspectRatio;
  icon: "square" | "portrait" | "landscape";
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { label: "1:1", value: "1:1", icon: "square" },
  { label: "3:4", value: "3:4", icon: "portrait" },
  { label: "4:3", value: "4:3", icon: "landscape" },
  { label: "9:16", value: "9:16", icon: "portrait" },
  { label: "16:9", value: "16:9", icon: "landscape" },
  { label: "1:4", value: "1:4", icon: "portrait" },
  { label: "4:1", value: "4:1", icon: "landscape" },
  { label: "1:8", value: "1:8", icon: "portrait" },
  { label: "8:1", value: "8:1", icon: "landscape" },
];

export const IMAGE_SIZE_OPTIONS: { label: string; value: ImageSize }[] = [
  { label: "0.5K (512px)", value: 512 },
  { label: "1K (1024px)", value: 1024 },
  { label: "2K (2048px)", value: 2048 },
  { label: "4K (4096px)", value: 4096 },
];

export interface ExportData {
  version: number;
  exportedAt: number;
  app: string;
  conversations: Conversation[];
}

export function computeDimensions(
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): string {
  const [w, h] = aspectRatio.split(":").map(Number);
  const scale = Math.sqrt((imageSize * imageSize) / (w * h));
  return `${Math.round(w * scale)} × ${Math.round(h * scale)}`;
}
