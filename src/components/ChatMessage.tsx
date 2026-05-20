"use client";

import { useState } from "react";
import Image from "next/image";
import type { Message } from "@/lib/types";
import { computeDimensions } from "@/lib/types";
import { formatCOP } from "@/lib/exchange-rate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: Message;
  showApproval?: boolean;
  isModification?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRegenerate?: (detailedPrompt: string) => void;
}

export function ChatMessage({
  message,
  showApproval,
  isModification,
  onApprove,
  onReject,
  onRegenerate,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message.detailedPrompt) return;
    try {
      await navigator.clipboard.writeText(message.detailedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy prompt: ", err);
    }
  };

  if (showApproval && message.detailedPrompt && !message.imageData) {
    return (
      <div className="flex justify-start">
        <Card className="w-full max-w-2xl rounded-2xl rounded-bl-md border border-border/70 bg-card/80 py-0 shadow-sm">
          <CardHeader className="pb-0 pt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {isModification ? "Modificación" : "Prompt listo"}
              </Badge>
              <CardTitle className="text-sm">
                {isModification ? "Revisar modificación" : "Revisión final"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message.content}
            </p>
            <div className="rounded-lg border border-border/70 bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Prompt de modificación
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {message.detailedPrompt}
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={onReject} size="sm">
              Seguir refinando
            </Button>
            <Button onClick={onApprove} size="sm">
              {isModification ? "Modificar" : "Generar"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
        <Card className="w-full max-w-xl rounded-2xl rounded-bl-md border border-border/70 bg-card/80 py-0 shadow-sm">
          <CardContent className="space-y-3 py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message.content}
            </p>
            <div className="relative overflow-hidden rounded-lg border border-border/70 bg-muted/30">
              <Image
                src={dataUrl}
                alt="Generated image"
                width={800}
                height={600}
                className="h-auto max-h-[75vh] w-full object-contain"
                unoptimized
              />
              <div className="absolute right-2.5 top-2.5 flex gap-1.5 select-none">
                {message.aspectRatio && message.imageSize && (
                  <div className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm shadow-sm transition-opacity hover:bg-black/75">
                    {computeDimensions(message.aspectRatio, message.imageSize)}
                  </div>
                )}
                {message.costCOP && (
                  <div className="rounded-md bg-emerald-600/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm shadow-sm transition-opacity hover:bg-emerald-600">
                    {formatCOP(message.costCOP)}
                  </div>
                )}
              </div>
            </div>
            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Prompt utilizado
              </summary>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {message.detailedPrompt}
              </p>
            </details>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} title="Descargar imagen">
              Descargar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} title="Copiar prompt al portapapeles">
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              size="sm"
              onClick={() => onRegenerate?.(message.detailedPrompt!)}
              title="Regenerar esta imagen"
            >
              Regenerar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {isUser && (message.images || message.imageData) && (
          <div className={`grid gap-2 ${
            (message.images?.length || 1) > 1 ? "grid-cols-2" : "grid-cols-1"
          }`}>
            {message.images ? (
              message.images.map((img, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-sm transition-all hover:shadow-md">
                  <Image
                    src={`data:${img.mimeType || "image/png"};base64,${img.data}`}
                    alt={`User uploaded image ${idx + 1}`}
                    width={200}
                    height={200}
                    className="h-auto max-h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
              ))
            ) : (
              <div className="relative group overflow-hidden rounded-2xl border border-border/50 bg-muted/20 shadow-sm transition-all hover:shadow-md">
                <Image
                  src={`data:${message.mimeType || "image/png"};base64,${message.imageData}`}
                  alt="User uploaded image"
                  width={200}
                  height={200}
                  className="h-auto max-h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}
        
        <Card
          className={`rounded-2xl border border-border/70 py-0 shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card/80 text-foreground rounded-bl-md"
          }`}
        >
          <CardContent className="relative px-4 pb-4 pt-3 text-sm leading-relaxed">
            {message.content}
            {!isUser && message.costCOP && (
              <span className="absolute bottom-1 right-2.5 select-none text-[8px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-70">
                {formatCOP(message.costCOP)}
              </span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
