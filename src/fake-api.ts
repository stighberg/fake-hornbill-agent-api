import express from "express";
import crypto from "node:crypto";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 3001);
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Fake Ticket API",
    version: "1.0.0",
    description: "Fake API used to demonstrate MCP tool discovery and escalation"
  },
  servers: [
    {
      url: publicBaseUrl
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
                  title: {
                    type: "string",
                    description: "Short title for the ticket"
                  },
                  description: {
                    type: "string",
                    description: "Detailed description of the user issue"
                  },
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
            description: "Ticket created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ticketId: { type: "string" },
                    externalTicketId: { type: "string" },
                    status: { type: "string" },
                    url: { type: "string" }
                  },
                  required: ["ticketId", "externalTicketId", "status"]
                }
              }
            }
          }
        }
      }
    }
  }
};

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.post("/tickets", (req, res) => {
  const { title, description, priority, requesterId } = req.body ?? {};

  if (!title || !description) {
    return res.status(400).json({
      error: "title and description are required"
    });
  }

  const id = crypto.randomInt(100000, 999999);
  const externalTicketId = `FAKE-${id}`;

  return res.status(201).json({
    ticketId: externalTicketId,
    externalTicketId,
    status: "Created",
    url: `${publicBaseUrl}/tickets/${externalTicketId}`,
    received: {
      title,
      description,
      priority: priority ?? "medium",
      requesterId: requesterId ?? "unknown"
    }
  });
});

app.listen(port, () => {
  console.log(`Fake API running on ${publicBaseUrl}`);
  console.log(`OpenAPI: ${publicBaseUrl}/openapi.json`);
});
