# Lesson 3 — JARVIS Allowance Controller

A futuristic allowance controller for secondary-school students. The website is English.

## Start here

Open **PROMPTS.md** after cloning. It contains EVERY classroom prompt in order, including the complete student starter prompt. Colour presets and a custom colour picker are part of Prompt 00. Do not paste every stage at once.

A working first-stage app is included as a fallback: HUD, colour controls and transaction ledger. Charts, savings targets and the advisor are compiling placeholders. Use Prompt 00 to generate/refine your starter with your chosen name and colour; then follow the numbered stages.

## Run on Windows

Open the folder containing package.json in VS Code. Use a compatible Node version (Vite 7 requires Node 20.19+ or 22.12+; this project was checked on Node 24).

```sh
npm install
npm run dev
```

Open the localhost address printed by the terminal. Ctrl+C stops the server. Check source with `npm run build` and money logic with `npm test`.

The first visit seeds ONE $100 Allowance income dated today. Use fictional transactions. Log means record a transaction, not log in.

## GitHub Pages

The GitHub Actions workflow builds and deploys the site at `https://ramirodeassis3214-cell.github.io/jarvis-finance-starter/`. The repository must have Pages configured to use **GitHub Actions** as its build and deployment source. The site is static: the `/api/classify` server endpoint is not hosted by GitHub Pages, so live advisor requests require deploying the Node server separately and configuring the API route.

## Teacher reference components

`teacher/Charts.tsx`, `teacher/Goal.tsx` and `teacher/Advisor.tsx` are fallback examples. Copy only the needed file's contents into the corresponding `src/components` file. The examples' relative imports are designed for that destination. Students implement one module at a time with PROMPTS.md.

## AI configuration — teacher only

Copy .env.example to .env. Default AI_MODE=mock returns a clearly labelled fixed English example. To use OpenAI, configure AI_PROVIDER=openai, OPENAI_API_KEY and OPENAI_MODEL (for example, o4-mini), then set AI_MODE=live and restart the server. Alternatively, set AI_PROVIDER=gemini and configure GEMINI_API_KEY and GEMINI_MODEL. Keep credentials only in the ignored server-side .env file; never put keys in browser code, VITE_ variables, Git or prompts. Revoke any key exposed in chat or source control and replace it before enabling live mode. Real calls require a valid provider key, model access, quota and network. Live mode reports provider failures and never falls back to mock success.

All generated advice is requested in English. The student retains the final judgment. The local server listens on localhost; this is not a deployed payment/banking service.

## Storage

Transactions use integer cents and browser localStorage. Accent is saved under jarvis-accent. Git saves source, not the browser ledger. The previous ledger key is retained for compatibility; user-entered text is not silently translated or deleted. Different browsers/devices do not automatically sync.

## References

https://github.com/recharts/recharts
https://googleapis.github.io/js-genai/
https://ai.google.dev/gemini-api/docs/generate-content/structured-output
https://platform.openai.com/docs/api-reference/responses
