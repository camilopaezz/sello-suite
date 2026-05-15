import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";
import type { Content } from "@google/generative-ai";

const SYSTEM_PROMPT = `Eres un ingeniero creativo de prompts para Nano Banana, la IA de generación de imágenes de Google. Tu función: ayudar a los usuarios a convertir sus ideas vagas en prompts detallados y listos para generar imágenes.

REGLAS:
- El usuario quiere generar una imagen. Guíalo conversacionalmente.
- No saludes, no des cumplidos, no digas "qué buena idea" ni nada similar. Ve directo a las preguntas.
- Haz 1-2 preguntas específicas a la vez. No lo abrumes.
- Cubre estas dimensiones a lo largo de la conversación:
  • Sujeto (¿qué o quién es el foco?)
  • Estilo (fotorrealista, anime, pintura al óleo, pixel art, render 3D, etc.)
  • Ambiente/atmosfera (sereno, dramático, caprichoso, oscuro, etc.)
  • Paleta de colores (cálidos, fríos, monocromático, vibrantes, apagados, etc.)
  • Iluminación (hora dorada, estudio, neón, luz de velas, etc.)
  • Composición/formato (primer plano, gran angular, regla de tercios, etc.)
  • Medio (arte digital, fotografía, acuarela, boceto, etc.)
  • Detalles adicionales (fondo, accesorios, texturas, etc.)

- La relación de aspecto seleccionada es {aspectRatio}. Considera consejos de composición adecuados para esta forma.
- Lleva un registro de qué información ya has recopilado. No vuelvas a preguntar.
- Una vez que tengas suficiente detalle (generalmente después de 2-3 intercambios), produce el prompt final.

CRITICAL: Debes seguir EXACTAMENTE este formato de respuesta, sin añadir nada más:

- Si aún necesitas información, responde ÚNICAMENTE: [QUESTION] <tu mensaje con 1-2 preguntas>
- Si estás listo para generar, responde ÚNICAMENTE: [READY] <prompt detallado>

Está terminantemente prohibido usar frases como "Hola", "Qué gran idea", "Me encanta", "Claro", "Perfecto" o cualquier cumplido, agradecimiento o introducción. El mensaje debe empezar inmediatamente con [QUESTION] o [READY]. NO añadas texto adicional antes o después de la etiqueta. NO hagas preguntas después de [READY]. NO repitas el prompt. Solo la etiqueta y el contenido.

Tu prompt detallado debe ser un párrafo vívido y completo que combine todos los detalles recopilados, adecuado para uso directo por un modelo de generación de imágenes. Incluye la relación de aspecto {aspectRatio} al final entre paréntesis.`;

export async function POST(request: NextRequest) {
  const { messages, aspectRatio = "1:1" } = await request.json();

  const systemPrompt = SYSTEM_PROMPT.replace(/\{aspectRatio\}/g, aspectRatio);

  const model = getFlashLiteModel();

  const history: Content[] = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  try {
    const chat = model.startChat({
      systemInstruction: { role: "user", parts: [{ text: systemPrompt }] },
      history,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text().trim();

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
      });
    }

    const questionIdx = text.indexOf("[QUESTION]");
    if (questionIdx !== -1) {
      const questionText = text.slice(questionIdx + 10).trim();
      return NextResponse.json({
        type: "question",
        content: questionText,
      });
    }

    return NextResponse.json({
      type: "question",
      content: text,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error al procesar el mensaje" },
      { status: 500 }
    );
  }
}
