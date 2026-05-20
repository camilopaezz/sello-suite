"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, SendHorizontal } from "lucide-react";
import Image from "next/image";

interface PromptInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (message: string, images?: { data: string; mimeType: string }[]) => void;
  disabled: boolean;
  placeholder?: string;
}

export function PromptInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Describe la imagen que quieres crear...",
}: PromptInputProps) {
  const [selectedImages, setSelectedImages] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasDisabledRef = useRef(disabled);

  useEffect(() => {
    if (wasDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }
    wasDisabledRef.current = disabled;
  }, [disabled]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if ((!trimmed && selectedImages.length === 0) || disabled) return;

    onSend(trimmed, selectedImages.length > 0 ? selectedImages.map(img => ({
      data: img.data,
      mimeType: img.mimeType
    })) : undefined);

    setSelectedImages([]);
    queueMicrotask(() => textareaRef.current?.focus());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 4 - selectedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`Solo puedes subir hasta 4 imágenes por mensaje. Se añadirán las primeras ${remainingSlots}.`);
    }

    filesToProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`La imagen ${file.name} es demasiado grande. Por favor usa imágenes de menos de 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(",")[1];
        setSelectedImages(prev => [...prev, {
          data: base64Data,
          mimeType: file.type,
          previewUrl: result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {selectedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {selectedImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm ring-1 ring-black/5">
                <Image
                  src={img.previewUrl}
                  alt={`Upload preview ${idx + 1}`}
                  width={80}
                  height={80}
                  className="size-16 object-cover transition-transform duration-300 group-hover:scale-105 sm:size-20"
                />
              </div>
              <button
                onClick={() => removeImage(idx)}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-all hover:scale-110 active:scale-95"
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <div className="relative flex-1 group">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="min-h-[52px] w-full resize-none bg-muted/40 py-4 pl-4 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/30 transition-all duration-200 border-border/50 rounded-2xl"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || selectedImages.length >= 4}
            className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Subir imágenes"
          >
            <ImagePlus className="size-5" />
          </button>
        </div>

        <Button 
          type="submit" 
          disabled={disabled || (!value.trim() && selectedImages.length === 0)}
          size="icon"
          className="size-[52px] shrink-0 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
        >
          <SendHorizontal className="size-5" />
        </Button>
      </form>
    </div>
  );
}
