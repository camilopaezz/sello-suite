"use client";

import Image from "next/image";
import type { Message } from "@/lib/types";
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
  onApprove?: () => void;
  onReject?: () => void;
  onRegenerate?: (detailedPrompt: string) => void;
}

export function ChatMessage({
  message,
  showApproval,
  onApprove,
  onReject,
  onRegenerate,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  if (showApproval && message.detailedPrompt && !message.imageData) {
    return (
      <div className="flex justify-start">
        <Card className="w-full max-w-2xl rounded-2xl rounded-bl-md border border-border/70 bg-card/80 py-0 shadow-sm">
          <CardHeader className="pb-0 pt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Prompt listo
              </Badge>
              <CardTitle className="text-sm">Revisión final</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 py-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message.content}
            </p>
            <div className="rounded-lg border border-border/70 bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Prompt detallado
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
              Generar
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
            <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
              <Image
                src={dataUrl}
                alt="Generated image"
                width={800}
                height={600}
                className="h-auto max-h-[75vh] w-full object-contain"
                unoptimized
              />
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
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              Descargar
            </Button>
            <Button
              size="sm"
              onClick={() => onRegenerate?.(message.detailedPrompt!)}
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
      <Card
        className={`max-w-xl rounded-2xl border border-border/70 py-0 shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card/80 text-foreground rounded-bl-md"
        }`}
      >
        <CardContent className="px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </CardContent>
      </Card>
    </div>
  );
}
