import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";

const SYSTEM_PROMPT = `Eres un ingeniero de prompts para MODIFICACIÓN de imágenes con Gemini.

El usuario ya tiene una imagen generada y quiere modificarla. 
Si el usuario sube NUEVAS imágenes de referencia, úsalas como guía para los cambios solicitados (estilo, nuevos elementos, etc.).

Contexto de la conversación:
{conversationText}

Prompt de la imagen actual:
{previousPrompt}

Relación de aspecto: {aspectRatio}

REGLAS:
- Describe EXPLÍCITAMENTE qué cambiar y qué conservar.
- Si hay imágenes de referencia nuevas, describe sus elementos e intégralos en el nuevo prompt.
- El prompt debe ser un párrafo vívido y completo.
- Incluye la relación de aspecto {aspectRatio} al final entre paréntesis.

FORMATO:
<explicación breve>
[MODIFY_PROMPT] <prompt detallado>`;

export async function POST(request: NextRequest) {
  const { messages, previousPrompt, aspectRatio = "1:1" } = await request.json();

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json({ error: "Se esperaba un mensaje de usuario" }, { status: 400 });
  }

  const conversationText = messages
    .slice(0, -1)
    .map((m: any) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`)
    .join("\n");

  const systemPrompt = SYSTEM_PROMPT
    .replace(/\{conversationText\}/g, conversationText || "No hay conversación previa")
    .replace(/\{previousPrompt\}/g, previousPrompt || "No hay prompt anterior")
    .replace(/\{aspectRatio\}/g, aspectRatio);

  const model = getFlashLiteModel();

  try {
    const parts: any[] = [
      { text: systemPrompt },
      { text: `Solicitud de modificación: ${lastMessage.content}` }
    ];

    if (lastMessage.images && lastMessage.images.length > 0) {
      lastMessage.images.forEach((img: any) => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text().trim();
    const usageMetadata = result.response.usageMetadata;
    const usage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount,
      completionTokens: usageMetadata.candidatesTokenCount,
    } : undefined;

    const modifyIdx = text.indexOf("[MODIFY_PROMPT]");
    if (modifyIdx !== -1) {
      const content = text.slice(0, modifyIdx).trim();
      const improvedPrompt = text.slice(modifyIdx + 15).trim();

      return NextResponse.json({
        type: "ready",
        content: content || "He mejorado tu solicitud de modificación. ¿Aprobamos?",
        improvedPrompt,
        usage,
      });
    }

    return NextResponse.json({
      type: "ready",
      content: "He mejorado tu solicitud de modificación. ¿Aprobamos?",
      improvedPrompt: text,
      usage,
    });
  } catch (error) {
    console.error("Modify API error:", error);
    return NextResponse.json(
      { error: "Error al procesar la modificación" },
      { status: 500 }
    );
  }
}
