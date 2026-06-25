# Demo scenarios

## Scenario 1: Create normal ticket

Request:

```json
{
  "requesterEmail": "demo.user@example.com",
  "title": "Cannot access customer portal",
  "description": "User cannot log in after password reset.",
  "category": "Access",
  "priority": "Medium",
  "conversationSummary": "The agent tried basic troubleshooting. The issue remains unresolved."
}
```

Expected result: `201 Created` with ticket id starting with `FAKE-INC-`.

## Scenario 2: Create high priority ticket

Use `priority = High`.

Expected result: ticket id starts with `FAKE-HIGH-`.

## Scenario 3: Validation error

Request:

```json
{
  "requesterEmail": "demo.user@example.com",
  "title": "",
  "description": ""
}
```

Expected result: `400 VALIDATION_ERROR`.

## Scenario 4: Get ticket

Use a ticket id starting with `FAKE-INC-` or `FAKE-HIGH-`.

Expected result: `200 OK`.

## Scenario 5: Ticket not found

Use any other ticket id, for example `UNKNOWN-123`.

Expected result: `404 TICKET_NOT_FOUND`.

## Scenario 6: Resolve requester not found

Call:

```http
GET /users/resolve?email=unknown@example.com
```

Expected result: `404 REQUESTER_NOT_FOUND`.
