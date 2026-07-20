# Repository Guidelines

NeuronNook is a Next.js 16 (App Router) + React 19 + TypeScript app that connects Google and Microsoft accounts to categorize emails, files, and photos via NVIDIA NIM and OpenRouter.

## Project Structure & Module Organization

- `app/` — `app/page.tsx` is the landing page. `app/dashboard/` holds the Gmail, Drive, Photos, OneDrive, and Diagnostics views (each with `page.tsx` + `loading.tsx`). `app/api/` houses the server route handlers (`drive`, `gmail`, `onedrive`, `photos`, `test-db`).
- `components/` — `components/ui/` is the shadcn/ui (new-york style) library; treat as generated. Domain UI sits in `components/dashboard/`, `components/auth/`, and `components/providers/`. Icons live in `components/icons.tsx` and `lucide-react`.
- `hooks/` — Shared hooks (`use-mobile.ts`, `use-toast.ts`).
- `lib/` — Server/shared helpers: `db.ts`, `mongodb.ts`, `auth.ts`, `ai-categorize.ts`, `types.ts`, `utils.ts`. Use `cn(...)` from `lib/utils.ts` to merge Tailwind classes.
- `public/` — Static assets. `styles/globals.css` and `app/globals.css` carry Tailwind v4 globals — keep them in sync. The `@/*` alias maps to the project root via `tsconfig.json`.

## Build, Test, and Development Commands

- `npm run dev` — `next dev` (Turbopack) on `http://localhost:3000`.
- `npm run build` / `npm start` — Production build and serve.
- `npm run lint` — Flat-config ESLint; run before opening a PR.
- `npm run deploy` — `vercel --prod`.

## Coding Style & Naming Conventions

- TypeScript is strict (`tsconfig.json`); fix type errors even though `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`.
- 2-space indent, double quotes, semicolons — matches existing `lib/` and `app/api/` files.
- PascalCase for component filenames (`ai-insights.tsx`); lowercase route folders (`app/dashboard/gmail`).
- Kebab-case for hooks and library modules (`use-mobile.ts`, `ai-categorize.ts`); camelCase functions, PascalCase types. Add new UI primitives via the shadcn CLI rather than hand-rolling them.

## Testing Guidelines

- No automated runner is wired up yet. `GET /api/test-db` is the only smoke surface — it validates the MongoDB connection.
- Add tests as `*.test.ts(x)` next to the module or under `__tests__/`. Pick Vitest or Jest and document the choice in the PR.
- Smoke-check `lib/db.ts` or `app/api/**` changes with `npm run dev` and `curl http://localhost:3000/api/test-db`.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits with lowercase prefixes (`feat:`, `fix:`, `debug:`, `test:`), e.g., `feat: add photos diagnostics page`. Prefer the structured form for new work.
- PRs need an imperative title, a 1–3 sentence summary, a linked issue (`Closes #123`), screenshots/clips for UI changes under `a
pp/dashboard/**` or `components/dashboard/**`, a note on new env vars or schema changes, and a passing `npm run lint` + `npm run build`.

## Security & Configuration Tips

- Secrets live only in `.env.local` (MongoDB URI, Google/Microsoft OAuth client IDs + secrets, `NVIDIA_API_KEY`/`NIM_API_KEY`, `OPENROUTER_API_KEY`). Never commit it; `.gitignore` already excludes it.
- Register OAuth redirect URIs per environment and keep Google + Microsoft consoles in sync.
- Tokens in `lib/db.ts` (`googleAccessToken`, `microsoftAccessToken`, …) are sensitive — redact in logs and never echo in API responses.
- `lib/ai-categorize.ts` parses the first JSON object from model output; when you swap providers or schemas, update both the Zod schemas and the JSON fallback parser together.
