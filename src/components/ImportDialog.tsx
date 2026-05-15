"use client";

import { useState, useRef, type FormEvent } from "react";
import type { ExportData } from "@/lib/types";
import { importConversations } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    count: number;
    firstDate?: string;
    lastDate?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ExportData;
        if (
          !data.version ||
          !Array.isArray(data.conversations)
        ) {
          setError("El archivo no tiene el formato esperado.");
          return;
        }
        const convs = data.conversations;
        const sorted = [...convs].sort(
          (a, b) => a.createdAt - b.createdAt
        );
        setPreview({
          count: convs.length,
          firstDate: sorted[0]
            ? new Date(sorted[0].createdAt).toLocaleDateString()
            : undefined,
          lastDate: sorted[sorted.length - 1]
            ? new Date(
                sorted[sorted.length - 1].createdAt
              ).toLocaleDateString()
            : undefined,
        });
      } catch {
        setError("No se pudo leer el archivo. Asegúrate de que sea un JSON válido.");
      }
    };
    reader.readAsText(f);
  }

  async function handleImport(e: FormEvent) {
    e.preventDefault();
    if (!file || !preview) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      await importConversations(data.conversations);
      onImportComplete();
      onOpenChange(false);
      setFile(null);
      setPreview(null);
    } catch {
      setError("Error al importar las conversaciones.");
    } finally {
      setImporting(false);
    }
  }

  function handleCancel() {
    onOpenChange(false);
    setFile(null);
    setPreview(null);
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="mx-4 w-full max-w-md">
        <form onSubmit={handleImport}>
          <CardHeader>
            <CardTitle className="text-sm">Importar conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
            />

            {preview && (
              <div className="rounded-lg border border-border/70 bg-muted/50 p-3 text-sm">
                <p className="font-medium">{preview.count} conversación(es)</p>
                {preview.firstDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {preview.firstDate} — {preview.lastDate}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Las conversaciones con IDs existentes serán sobrescritas.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || !preview || importing}
            >
              {importing ? "Importando..." : "Importar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
