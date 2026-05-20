import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";
import type { Content } from "@google/generative-ai";

const SYSTEM_PROMPT = `Eres un ingeniero creativo de prompts para Sello Studio, una aplicación de generación de imágenes. Tu función: ayudar a los usuarios a convertir sus ideas o imágenes en prompts detallados y listos para generar.

REGLAS CRÍTICAS DE IMÁGENES:
- Si el usuario proporciona imágenes, estas son tu REFERENCIA PRINCIPAL. 
- Debes analizar cada detalle: el sujeto, la técnica artística, la paleta de colores exacta, la iluminación y la composición.
- Al producir el prompt final ([READY]), DEBES incluir descripciones explícitas de los elementos visuales de las imágenes proporcionadas. No digas "como en la foto", describe lo que ves en la foto (ej: "un personaje con armadura dorada intrincada y ojos brillantes de color cian, siguiendo el estilo de pintura al óleo de la imagen de referencia").
- Si hay múltiples imágenes, integra elementos de todas ellas según lo solicitado.

REGLAS DE CONVERSACIÓN:
- El usuario quiere generar una imagen. Guíalo de forma profesional y directa.
- No saludes, no des cumplidos, ve directo a las preguntas o al prompt.
- Haz 1-2 preguntas específicas a la vez para refinar detalles faltantes.
- La relación de aspecto seleccionada es {aspectRatio}.

FORMATO DE RESPUESTA (ESTRICTO):
- Si necesitas información: [QUESTION] <tu mensaje>
- Si estás listo para generar: [READY] <prompt detallado y vívido que incorpore TODOS los elementos visuales analizados y las preferencias del usuario>

Está prohibido usar frases como "Hola", "Claro", "Perfecto". El mensaje debe empezar inmediatamente con [QUESTION] o [READY].`;

export async function POST(request: NextRequest) {
  const { messages, aspectRatio = "1:1" } = await request.json();

  const systemPrompt = SYSTEM_PROMPT.replace(/\{aspectRatio\}/g, aspectRatio);

  const model = getFlashLiteModel();

  const history: Content[] = messages.slice(0, -1).map((m: any) => {
    const parts: any[] = [{ text: m.content || "" }];
    if (m.images && m.images.length > 0) {
      m.images.forEach((img: any) => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      });
    } else if (m.imageData && m.mimeType) {
      parts.push({
        inlineData: {
          mimeType: m.mimeType,
          data: m.imageData,
        },
      });
    }
    return {
      role: m.role === "user" ? "user" : "model",
      parts,
    };
  });

  const lastMessage = messages[messages.length - 1];
  const lastParts: any[] = [{ text: lastMessage.content || "" }];
  if (lastMessage.images && lastMessage.images.length > 0) {
    lastMessage.images.forEach((img: any) => {
      lastParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      });
    });
  } else if (lastMessage.imageData && lastMessage.mimeType) {
    lastParts.push({
      inlineData: {
        mimeType: lastMessage.mimeType,
        data: lastMessage.imageData,
      },
    });
  }

  try {
    const chat = model.startChat({
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
      history,
    });

    const result = await chat.sendMessage(lastParts);
    const text = result.response.text().trim();
    const usageMetadata = result.response.usageMetadata;
    const usage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount,
      completionTokens: usageMetadata.candidatesTokenCount,
    } : undefined;

    const readyIdx = text.indexOf("[READY]");
    if (readyIdx !== -1) {
      const content = text.slice(0, readyIdx).trim();

      let detailedPrompt = text.slice(readyIdx + 7).trim();

      const aspectMatch = detailedPrompt.match(/\(Relación de aspecto \S+\)/);
      if (aspectMatch && aspectMatch.index !== undefined) {
        detailedPrompt = detailedPrompt.slice(0, aspectMatch.index + aspectMatch[0].length).trim();
      }

      return NextResponse.json({
        type: "ready",
        content: content || "Ya tengo suficiente detalle. ¿Aprobamos este prompt para generar la imagen?",
        detailedPrompt,
        usage,
      });
    }

    const questionIdx = text.indexOf("[QUESTION]");
    if (questionIdx !== -1) {
      const questionText = text.slice(questionIdx + 10).trim();
      return NextResponse.json({
        type: "question",
        content: questionText,
        usage,
      });
    }

    return NextResponse.json({
      type: "question",
      content: text,
      usage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error al procesar el mensaje" },
      { status: 500 }
    );
  }
}
