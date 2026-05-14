import { NextRequest, NextResponse } from "next/server";
import { getFlashLiteModel } from "@/lib/gemini";
import type { Content } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a creative prompt engineer for Nano Banana, Google's image generation AI. Your role: help users refine their vague ideas into detailed, image-ready prompts.

GUIDELINES:
- The user wants to generate an image. Guide them conversationally.
- Ask 1-2 specific questions at a time. Don't overwhelm.
- Cover these dimensions across the conversation:
  • Subject (what/who is the focus?)
  • Style (photorealistic, anime, oil painting, pixel art, 3D render, etc.)
  • Mood/atmosphere (serene, dramatic, whimsical, dark, etc.)
  • Color palette (warm, cool, monochrome, vibrant, muted, etc.)
  • Lighting (golden hour, studio lighting, neon, candlelit, etc.)
  • Composition/format (close-up, wide shot, rule of thirds, etc.)
  • Medium (digital art, photograph, watercolor, sketch, etc.)
  • Additional details (background, props, textures, etc.)

- The selected aspect ratio is {aspectRatio}. Consider composition tips suited to this shape.
- Track what information you have already gathered. Do not re-ask.
- Once you have sufficient detail (typically after 2-3 exchanges), produce a final prompt.

FORMAT YOUR RESPONSE:
- If still need information: [QUESTION] <your message with 1-2 questions>
- If ready to generate: [READY] <detailed prompt of 2-4 rich descriptive sentences>

Your detailed prompt must be a vivid, comprehensive paragraph combining all gathered details, suitable for direct use by an image generation model. Include the aspect ratio {aspectRatio} at the end in parentheses.`;

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

    if (text.startsWith("[READY]")) {
      const detailedPrompt = text.replace("[READY]", "").trim();
      return NextResponse.json({
        type: "ready",
        content: "I've gathered enough detail. Generating your image now...",
        detailedPrompt,
      });
    }

    const questionText = text.replace("[QUESTION]", "").trim();
    return NextResponse.json({
      type: "question",
      content: questionText,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
