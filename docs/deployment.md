# Deployment notes

The repository is runtime-neutral. The current TypeScript scaffold is prepared for Cloudflare Workers through `wrangler.toml`, but the same API contract can also be implemented with Vercel, Render, Railway, Azure Functions or another backend later.

## Local development

```bash
npm install
npm run typecheck
npm run dev
```

## Cloudflare Workers direction

1. Create/log in to a Cloudflare account.
2. Install dependencies with `npm install`.
3. Run `npm run dev` locally.
4. Deploy with `npm run deploy` when ready.

## Vercel direction

The same contract can be moved to Vercel Functions if that becomes simpler for the demo team.

## Production direction

For real Hornbill integration, keep the public API contract stable and replace fake logic behind the routes with a real adapter:

```text
CreateSupportTicket
  -> HornbillTicketService
    -> Hornbill chatbotLogRequest / logIncident / logServiceRequest
```
