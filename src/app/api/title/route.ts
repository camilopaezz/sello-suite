import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";
import type { Message } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ title: "Nueva conversación" });
  }

  try {
    const userMessages = (messages as Message[]).filter(
      (m) => m.role === "user"
    );
    const summary = userMessages
      .slice(0, 3)
      .map((m) => m.content)
      .join(" ");
    const truncated =
      summary.length > 300 ? summary.slice(0, 300) + "..." : summary;

    const model = getFlashLiteModel();

    const result = await model.generateContent(
      `Genera un título descriptivo corto (máximo 6 palabras, sin comillas, sin markdown) para esta conversación de generación de imágenes. El usuario quiere crear: ${truncated}`
    );

    const title = result.response.text().trim();
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({
      title: `Chat del ${new Date().toLocaleDateString()}`,
    });
  }
}
