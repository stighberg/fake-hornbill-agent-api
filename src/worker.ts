const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Fake Hornbill Agent API",
    version: "1.0.0",
    description: "Fake API used to demonstrate MCP tool discovery and escalation"
  },
  servers: [
    {
      url: "https://fake-hornbill-agent-api.<din-worker-subdomain>.workers.dev"
    }
  ],
  paths: {
    "/tickets": {
      post: {
        operationId: "create_ticket",
        summary: "Create support ticket",
        description: "Escalates a user issue by creating a fake support ticket.",
        "x-mcp-enabled": true,
        "x-mcp-name": "create_ticket",
        "x-mcp-description": "Create a fake support ticket when the user wants to escalate an issue.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string", description: "Short title for the ticket" },
                  description: { type: "string", description: "Detailed description of the user issue" },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Ticket priority"
                  },
                  requesterId: {
                    type: "string",
                    description: "User id or employee id for the requester"
                  }
                },
                required: ["title", "description"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Ticket created"
          }
        }
      }
    }
  }
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/openapi.json") {
      const doc = structuredClone(openApiDocument);
      doc.servers[0].url = url.origin;
      return json(doc);
    }

    if (request.method === "POST" && url.pathname === "/tickets") {
      const body = await request.json().catch(() => ({})) as any;

      if (!body.title || !body.description) {
        return json({ error: "title and description are required" }, 400);
      }

      const id = Math.floor(100000 + Math.random() * 900000);
      const externalTicketId = `FAKE-${id}`;

      return json({
        ticketId: externalTicketId,
        externalTicketId,
        status: "Created",
        url: `${url.origin}/tickets/${externalTicketId}`,
        received: {
          title: body.title,
          description: body.description,
          priority: body.priority ?? "medium",
          requesterId: body.requesterId ?? "unknown"
        }
      }, 201);
    }

    return json({ error: "Not found" }, 404);
  }
};
