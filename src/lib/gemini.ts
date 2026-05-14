import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getFlashLiteModel() {
  return getClient().getGenerativeModel({
    model: "gemini-3.1-flash-lite",
  });
}

export function getImageGenModel() {
  return getClient().getGenerativeModel({
    model: "gemini-3.1-flash-image-preview",
  });
}
