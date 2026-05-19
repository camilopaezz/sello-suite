import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";

const SYSTEM_PROMPT = `Eres un ingeniero de prompts para MODIFICACIÓN de imágenes con Gemini.

El usuario ya tiene una imagen generada y quiere modificarla.
Tu tarea es mejorar su solicitud de modificación convirtiéndola en un prompt detallado, preciso y descriptivo para modificar la imagen existente.

Contexto de la conversación hasta ahora:
{conversationText}

Prompt detallado usado para generar la imagen actual:
{previousPrompt}

Relación de aspecto de la imagen: {aspectRatio}

Solicitud de modificación del usuario:
{modificationText}

REGLAS IMPORTANTES:
- Describe EXPLÍCITAMENTE qué cambiar y qué conservar de la imagen original
- Sé específico: colores, estilo, composición, iluminación, sujeto, fondo
- Si el usuario no menciona algo, presume que debe conservarse tal como está en la imagen original
- El prompt debe ser un párrafo vívido y completo, listo para usar directamente en generación de imágenes
- Incluye la relación de aspecto {aspectRatio} al final del prompt entre paréntesis

Debes responder EXACTAMENTE con este formato, sin añadir texto adicional antes o después:

<Una explicación breve y natural de cómo mejoraste su solicitud, en español>
[MODIFY_PROMPT] <Prompt detallado de modificación en español>

Está terminantemente prohibido usar frases como "Hola", "Qué gran idea", "Me encanta", "Claro", "Perfecto" o cualquier cumplido, agradecimiento o introducción. No añadas texto adicional antes o después de la etiqueta.`;

export async function POST(request: NextRequest) {
  const { messages, previousPrompt, aspectRatio = "1:1" } = await request.json();

  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Se esperaba un mensaje de usuario" },
      { status: 400 }
    );
  }

  const conversationText = messages
    .slice(0, -1)
    .map((m: { role: string; content: string }) =>
      `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`
    )
    .join("\n");

  const systemPrompt = SYSTEM_PROMPT
    .replace(/\{conversationText\}/g, conversationText || "No hay conversación previa")
    .replace(/\{previousPrompt\}/g, previousPrompt || "No hay prompt anterior")
    .replace(/\{aspectRatio\}/g, aspectRatio)
    .replace(/\{modificationText\}/g, lastMessage.content);

  const model = getFlashLiteModel();

  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();

    const modifyIdx = text.indexOf("[MODIFY_PROMPT]");
    if (modifyIdx !== -1) {
      const content = text.slice(0, modifyIdx).trim();
      const improvedPrompt = text.slice(modifyIdx + 15).trim();

      return NextResponse.json({
        type: "ready",
        content: content || "He mejorado tu solicitud de modificación. ¿Aprobamos?",
        improvedPrompt,
      });
    }

    return NextResponse.json({
      type: "ready",
      content: "He mejorado tu solicitud de modificación. ¿Aprobamos?",
      improvedPrompt: text,
    });
  } catch (error) {
    console.error("Modify API error:", error);
    return NextResponse.json(
      { error: "Error al procesar la modificación" },
      { status: 500 }
    );
  }
}
