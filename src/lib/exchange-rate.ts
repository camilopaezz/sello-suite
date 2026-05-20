import type { ImageSize } from "./types";

const CACHE_KEY_RATE = "usd_to_cop_rate";
const CACHE_KEY_TIMESTAMP = "usd_to_cop_timestamp";
const DEFAULT_FALLBACK_RATE = 3950;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const IMAGE_COSTS_USD: Record<ImageSize, number> = {
  512: 0.034, // 0.5K
  1024: 0.067, // 1K
  2048: 0.101, // 2K
  4096: 0.151, // 4K
};

/**
 * Retrieves the USD to COP exchange rate.
 * Leverages a daily cache inside localStorage, or fetches a new one if expired/missing.
 */
export async function getUSDToCOPRate(): Promise<number> {
  if (typeof window === "undefined") return DEFAULT_FALLBACK_RATE;

  const cachedRateStr = localStorage.getItem(CACHE_KEY_RATE);
  const cachedTimestampStr = localStorage.getItem(CACHE_KEY_TIMESTAMP);
  const now = Date.now();

  if (cachedRateStr && cachedTimestampStr) {
    const cachedRate = parseFloat(cachedRateStr);
    const cachedTimestamp = parseInt(cachedTimestampStr, 10);

    if (
      !isNaN(cachedRate) &&
      !isNaN(cachedTimestamp) &&
      now - cachedTimestamp < ONE_DAY_MS
    ) {
      return cachedRate;
    }
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("Exchange rate response was not ok");
    const data = await res.json();
    const freshRate = data.rates?.["COP"];

    if (typeof freshRate === "number") {
      localStorage.setItem(CACHE_KEY_RATE, freshRate.toString());
      localStorage.setItem(CACHE_KEY_TIMESTAMP, now.toString());
      return freshRate;
    }
  } catch (error) {
    console.warn("Could not fetch USD to COP rate, returning fallback:", error);
  }

  return DEFAULT_FALLBACK_RATE;
}

/**
 * Calculates individual image generation cost in COP
 */
export async function calculateImageCostCOP(
  imageSize: ImageSize,
): Promise<number> {
  const costUSD = IMAGE_COSTS_USD[imageSize] || 0.067;
  const rate = await getUSDToCOPRate();
  return Math.round(costUSD * rate);
}

/**
 * Calculates individual text generation cost in COP for gemini-3.1-flash-lite.
 * Pricing: $0.25 USD per 1M input tokens, $1.50 USD per 1M output tokens.
 */
export async function calculateTextCostCOP(
  inputTokens: number,
  outputTokens: number,
): Promise<number> {
  const inputCostUSD = (inputTokens / 1_000_000) * 0.25;
  const outputCostUSD = (outputTokens / 1_000_000) * 1.5;
  const rate = await getUSDToCOPRate();
  return (inputCostUSD + outputCostUSD) * rate;
}

/**
 * Formats a number as Colombian Peso currency (e.g. $265)
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}
