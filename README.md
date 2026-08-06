# Fake Hornbill Agent API

Demo API and integration workspace for building a Copilot Studio agent that can escalate conversations into a Hornbill-like ticketing backend.

The goal is to give the agent team a stable, agent-friendly contract now, while keeping the backend replaceable later.

```text
Copilot Studio
  -> Custom Connector / REST API tool
    -> Fake Hornbill Agent API
      -> fake validation and ticket responses
        -> later: real Hornbill adapter
```

## Current scope

This repository is the single source of truth for:

- the agent-facing API contract
- OpenAPI / Swagger definition for Copilot Studio and Power Platform custom connectors
- Postman assets for exploration and manual testing
- TypeScript demo API scaffold
- demo scenarios and Copilot Studio setup notes

## Agent-facing actions

The agent should use simple, semantic actions rather than Hornbill internal API names:

| Action | HTTP | Path | Purpose |
|---|---:|---|---|
| `CreateSupportTicket` | `POST` | `/tickets` | Create a new support ticket from an escalated conversation. |
| `GetSupportTicket` | `GET` | `/tickets/{ticketId}` | Read ticket status and summary. |
| `AddSupportTicketComment` | `POST` | `/tickets/{ticketId}/comments` | Add a user or agent comment to a ticket timeline. |
| `UpdateSupportTicketStatus` | `PATCH` | `/tickets/{ticketId}/status` | Update fake ticket status for demo flows. |
| `ResolveRequester` | `GET` | `/users/resolve` | Resolve an email/user id into a fake requester profile. |

## Recommended demo path

Start with this flow:

```text
Copilot Studio
  -> Custom Connector generated from openapi/fakehornbill.swagger.json
    -> deployed TypeScript API or Postman Flow URL
```

Postman Mock Server is still useful for static examples, but Postman Flow or the TypeScript API is better when the demo needs validation and branching.

## Azure demo deployment

The `workflows` branch includes a GitHub Actions workflow for deploying the TypeScript demo API to Azure Web App.

Required GitHub configuration:

- Repository variable `AZURE_WEBAPP_NAME`: the Azure Web App name
- Repository secret `AZURE_WEBAPP_PUBLISH_PROFILE`: the publish profile downloaded from the Azure Web App

The workflow installs dependencies, runs `npm run typecheck`, and deploys the repository contents. Azure starts the API with `npm start`, which runs `src/fake-api.ts` and listens on the `PORT` environment variable supplied by Azure.

## Repository structure

```text
src/        TypeScript demo API scaffold
openapi/    Swagger/OpenAPI contract
postman/    Postman collection/environment assets
docs/       Copilot Studio setup and demo documentation
.github/    GitHub Actions workflows
```

## Security

Do not commit real Hornbill API keys, customer data, Postman current values, access tokens, connection strings or environment secrets.

Use placeholders in source control and configure real secrets only in the target runtime or local developer environment.

## Next decisions

Runtime is intentionally replaceable. Current candidates:

- Postman Flow for quick API + logic demo
- Cloudflare Workers for TypeScript serverless API
- Vercel Functions for TypeScript serverless API
- later: real backend adapter for Hornbill
