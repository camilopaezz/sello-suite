import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "El prompt es obligatorio" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está configurada" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini API error:", res.status, errBody);
      return NextResponse.json(
        { error: `Gemini API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    let imageData: string | null = null;
    let mimeType = "image/png";

    for (const candidate of data.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          mimeType = part.inlineData.mimeType;
          break;
        }
      }
      if (imageData) break;
    }

    if (!imageData) {
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .filter(Boolean)
        .join(" ");

      return NextResponse.json(
        { error: "No hay datos de imagen en la respuesta", responseText: text ?? "" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: imageData, mimeType });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Error al generar la imagen" },
      { status: 500 }
    );
  }
}
