# Copilot Studio setup

## Recommended tool/action names

Use agent-friendly names and descriptions:

| Tool/action | Description |
|---|---|
| `CreateSupportTicket` | Creates a support ticket when the user needs help from support or the issue cannot be solved by the agent. |
| `GetSupportTicket` | Gets the status and summary of an existing support ticket. |
| `AddSupportTicketComment` | Adds extra information to an existing support ticket. |
| `ResolveRequester` | Resolves the current user to a requester profile before creating a ticket. |

## Recommended flow

```text
User asks for help
  -> agent tries knowledge/troubleshooting
    -> unresolved or user asks for human support
      -> collect required fields
        -> CreateSupportTicket
          -> show ticket id and next step
```

## Required fields for ticket creation

Minimum useful payload:

```json
{
  "requesterEmail": "user@example.com",
  "title": "Short issue title",
  "description": "Clear issue description",
  "priority": "Medium",
  "category": "Access",
  "conversationSummary": "What the agent already tried"
}
```

## Error handling

If `CreateSupportTicket` returns `VALIDATION_ERROR`, the agent should ask for the missing details and retry.

If the API returns `TICKET_NOT_FOUND`, the agent should explain that the ticket id could not be found and ask the user to verify it.

## Do not expose Hornbill internals to the agent

Avoid tool names like:

- `chatbotLogRequest`
- `logIncident`
- `updateReqTimeline`
- `smUpdateStatus`

Those names belong in the backend adapter, not in the agent UX.
