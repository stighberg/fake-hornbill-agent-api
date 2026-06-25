# API contract

The agent should use these operations only. Hornbill-specific XMLMC calls are adapter concerns and should not be exposed directly to Copilot Studio.

## CreateSupportTicket

```http
POST /tickets
Content-Type: application/json
```

```json
{
  "requesterEmail": "demo.user@example.com",
  "requesterUserId": "demo.user",
  "title": "Cannot access customer portal",
  "description": "User cannot log in. Password reset has already been attempted.",
  "category": "Access",
  "priority": "Medium",
  "conversationSummary": "The agent tried basic troubleshooting, but the problem remains unresolved.",
  "source": "CopilotStudio",
  "correlationId": "demo-correlation-id"
}
```

Success:

```json
{
  "ticketId": "FAKE-INC-123456",
  "externalTicketId": "INC-123456",
  "status": "Created",
  "title": "Cannot access customer portal",
  "priority": "Medium",
  "createdAt": "2026-06-25T12:00:00.000Z",
  "url": "https://fakehornbill.example/tickets/FAKE-INC-123456",
  "message": "Support ticket created successfully.",
  "correlationId": "demo-correlation-id"
}
```

Validation error:

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Ticket request is missing required fields.",
  "details": [
    {
      "field": "title",
      "message": "Title is required."
    }
  ]
}
```

## GetSupportTicket

```http
GET /tickets/{ticketId}
```

Known demo ticket ids start with `FAKE-INC-` or `FAKE-HIGH-`.

## AddSupportTicketComment

```http
POST /tickets/{ticketId}/comments
Content-Type: application/json
```

```json
{
  "comment": "The user provided additional troubleshooting information.",
  "authorEmail": "demo.user@example.com",
  "visibility": "public",
  "correlationId": "demo-correlation-id"
}
```

## UpdateSupportTicketStatus

```http
PATCH /tickets/{ticketId}/status
Content-Type: application/json
```

```json
{
  "status": "Resolved",
  "correlationId": "demo-correlation-id"
}
```

## ResolveRequester

```http
GET /users/resolve?email=demo.user@example.com
```

Use `unknown@example.com` or `userId=unknown` to simulate requester not found.
