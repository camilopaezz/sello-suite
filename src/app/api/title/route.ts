import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";
import type { Message } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ title: "New Chat" });
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
      `Generate a short descriptive title (max 6 words, no quotes, no markdown) for this image generation conversation. The user wants to create: ${truncated}`
    );

    const title = result.response.text().trim();
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({
      title: `Chat ${new Date().toLocaleDateString()}`,
    });
  }
}
