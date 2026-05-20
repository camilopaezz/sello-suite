<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nano Banana Studio (`sello-suite`)

This is an AI-powered image generation application built with Next.js 16 and deployed on Cloudflare Workers via OpenNext.

## Architecture & Deployment

- **Cloudflare OpenNext:** This app does not deploy to Vercel. It deploys to Cloudflare using `@opennextjs/cloudflare`.
- **Cache:** It uses a Cloudflare R2 bucket (`sello-suite-opennext-cache`) for Next.js incremental cache (configured in `open-next.config.ts` and `wrangler.jsonc`).
- **AI Models:** Uses Google Gemini (`gemini-3.1-flash-lite` for chat/prompt engineering and `gemini-3.1-flash-image-preview` for image generation) via `@google/generative-ai`.
- **Client Storage:** Conversation history and settings are stored locally in the browser using IndexedDB (`src/lib/storage.ts`).

## Developer Commands

- `npm run dev` - Standard Next.js local development server.
- `npm run preview` - Builds OpenNext artifacts and previews the Cloudflare Worker locally (crucial for verifying edge compatibility before deploying).
- `npm run deploy` - Deploys the application to Cloudflare.
- `npm run cf-typegen` - Run this whenever you modify bindings in `wrangler.jsonc` to regenerate `cloudflare-env.d.ts`.

## Environment

- `GEMINI_API_KEY` is required in `.env.local` for local development.

## Tech Stack & Conventions

- **Styling:** Uses Tailwind CSS **v4**. Avoid older v3 configuration patterns.
- **Components:** Uses `shadcn/ui` and `@base-ui/react`. UI components are in `src/components/ui/`.
- **TypeScript:** Strict mode is enabled.
- **State:** Mostly relies on React state and IndexedDB. There is no external database or auth provider currently configured.
