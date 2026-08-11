import { randomInt, randomUUID } from "node:crypto";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  isInitializeRequest,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const port = Number(process.env.PORT ?? 3001);
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;

type TicketStatus = "Created" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
type TicketPriority = "low" | "medium" | "high";

type TicketComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

type Ticket = {
  ticketId: string;
  externalTicketId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  requesterId: string;
  status: TicketStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
};

const tickets = new Map<string, Ticket>();

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Fake Hornbill Agent API",
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
            description: "Ticket created"
          }
        }
      }
    },
    "/tickets/{ticketId}": {
      get: {
        operationId: "get_ticket",
        summary: "Get support ticket",
        description: "Reads the current status, summary, and comments for a fake support ticket.",
        "x-mcp-enabled": true,
        "x-mcp-name": "get_ticket",
        "x-mcp-description": "Get the current status and details for an existing support ticket.",
        "x-mcp-input-schema": {
          type: "object",
          additionalProperties: false,
          properties: {
            ticketId: {
              type: "string",
              description: "Ticket id, for example FAKE-123456"
            }
          },
          required: ["ticketId"]
        },
        responses: {
          "200": {
            description: "Ticket found"
          },
          "404": {
            description: "Ticket not found"
          }
        }
      }
    },
    "/tickets/{ticketId}/comments": {
      post: {
        operationId: "add_ticket_comment",
        summary: "Add support ticket comment",
        description: "Adds a user or agent comment to the fake ticket timeline.",
        "x-mcp-enabled": true,
        "x-mcp-name": "add_ticket_comment",
        "x-mcp-description": "Add a comment to an existing support ticket.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  ticketId: {
                    type: "string",
                    description: "Ticket id, for example FAKE-123456"
                  },
                  text: {
                    type: "string",
                    description: "Comment text to add to the ticket timeline"
                  },
                  author: {
                    type: "string",
                    description: "Name or id of the person or agent adding the comment"
                  }
                },
                required: ["ticketId", "text"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Comment added"
          },
          "404": {
            description: "Ticket not found"
          }
        }
      }
    },
    "/tickets/{ticketId}/status": {
      patch: {
        operationId: "update_ticket_status",
        summary: "Update support ticket status",
        description: "Updates the fake ticket status for demo workflows.",
        "x-mcp-enabled": true,
        "x-mcp-name": "update_ticket_status",
        "x-mcp-description": "Update the status of an existing support ticket.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  ticketId: {
                    type: "string",
                    description: "Ticket id, for example FAKE-123456"
                  },
                  status: {
                    type: "string",
                    enum: ["Created", "In Progress", "Waiting for Customer", "Resolved", "Closed"],
                    description: "New ticket status"
                  },
                  comment: {
                    type: "string",
                    description: "Optional status change note"
                  }
                },
                required: ["ticketId", "status"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Status updated"
          },
          "404": {
            description: "Ticket not found"
          }
        }
      }
    },
    "/users/resolve": {
      get: {
        operationId: "resolve_requester",
        summary: "Resolve requester",
        description: "Resolves an email address or user id into a fake requester profile.",
        "x-mcp-enabled": true,
        "x-mcp-name": "resolve_requester",
        "x-mcp-description": "Resolve a requester by email address or user id before creating a ticket.",
        "x-mcp-input-schema": {
          type: "object",
          additionalProperties: false,
          properties: {
            email: {
              type: "string",
              description: "Requester email address"
            },
            userId: {
              type: "string",
              description: "Requester user id"
            }
          }
        },
        responses: {
          "200": {
            description: "Requester resolved"
          }
        }
      }
    }
  }
};

type OpenApiDocument = typeof openApiDocument;
type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  requestBody?: {
    content?: {
      "application/json"?: {
        schema?: JsonSchema;
      };
    };
  };
  ["x-mcp-input-schema"]?: JsonSchema;
  ["x-mcp-enabled"]?: boolean;
  ["x-mcp-name"]?: string;
  ["x-mcp-description"]?: string;
};

type JsonSchema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
};

type DiscoveredTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  method: string;
  path: string;
  baseUrl: string;
};

function discoverTools(document: OpenApiDocument): DiscoveredTool[] {
  const baseUrl = document.servers?.[0]?.url ?? publicBaseUrl;
  const tools: DiscoveredTool[] = [];

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem) as Array<
      [string, OpenApiOperation]
    >) {
      if (operation["x-mcp-enabled"] !== true) {
        continue;
      }

      const inputSchema =
        operation["x-mcp-input-schema"] ??
        operation.requestBody?.content?.["application/json"]?.schema ?? {
          type: "object",
          properties: {},
          required: []
        };

      tools.push({
        name: operation["x-mcp-name"] ?? operation.operationId ?? `${method}_${path}`,
        description:
          operation["x-mcp-description"] ??
          operation.description ??
          operation.summary ??
          operation.operationId ??
          `${method.toUpperCase()} ${path}`,
        inputSchema,
        method,
        path,
        baseUrl
      });
    }
  }

  return tools;
}

const discoveredTools = discoverTools(openApiDocument);

function createMcpServer() {
  const server = new Server(
    {
      name: "hornbill-demo-mcp-server",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: discoveredTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments ?? {};

    const tool = discoveredTools.find((x) => x.name === toolName);

    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${toolName}`
          }
        ],
        isError: true
      };
    }

    const argsRecord = args as Record<string, unknown>;
    const pathParams = Array.from(tool.path.matchAll(/\{([^}]+)\}/g)).map(
      (match) => match[1]
    );
    let requestPath = tool.path;

    for (const param of pathParams) {
      const value = argsRecord[param];

      if (value === undefined || value === null) {
        return {
          content: [
            {
              type: "text",
              text: `Missing required path parameter: ${param}`
            }
          ],
          isError: true
        };
      }

      requestPath = requestPath.replace(`{${param}}`, encodeURIComponent(String(value)));
    }

    const requestArgs = Object.fromEntries(
      Object.entries(argsRecord).filter(([key]) => !pathParams.includes(key))
    );
    const url = new URL(`${tool.baseUrl}${requestPath}`);
    const method = tool.method.toUpperCase();

    if (method === "GET") {
      for (const [key, value] of Object.entries(requestArgs)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: method === "GET" ? undefined : JSON.stringify(requestArgs)
    });

    const responseText = await response.text();

    let responseBody: unknown;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `API call failed with ${response.status}: ${JSON.stringify(responseBody)}`
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responseBody, null, 2)
        }
      ]
    };
  });

  return server;
}

const app = express();
const mcpSessions: Record<
  string,
  {
    server: Server;
    transport: StreamableHTTPServerTransport;
  }
> = {};

app.use(express.json());

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.post("/tickets", (req, res) => {
  const { title, description, priority, requesterId } = req.body ?? {};

  if (!title || !description) {
    res.status(400).json({
      error: "title and description are required"
    });
    return;
  }

  const id = randomInt(100000, 999999);
  const externalTicketId = `FAKE-${id}`;
  const now = new Date().toISOString();
  const ticket: Ticket = {
    ticketId: externalTicketId,
    externalTicketId,
    title,
    description,
    priority: priority ?? "medium",
    requesterId: requesterId ?? "unknown",
    status: "Created",
    url: `${publicBaseUrl}/tickets/${externalTicketId}`,
    createdAt: now,
    updatedAt: now,
    comments: []
  };

  tickets.set(externalTicketId, ticket);

  res.status(201).json({
    ticketId: ticket.ticketId,
    externalTicketId: ticket.externalTicketId,
    status: ticket.status,
    url: ticket.url,
    received: {
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      requesterId: ticket.requesterId
    }
  });
});

app.get("/tickets/:ticketId", (req, res) => {
  const ticket = tickets.get(req.params.ticketId);

  if (!ticket) {
    res.status(404).json({
      error: "Ticket not found",
      ticketId: req.params.ticketId
    });
    return;
  }

  res.json(ticket);
});

app.post("/tickets/:ticketId/comments", (req, res) => {
  const ticket = tickets.get(req.params.ticketId);

  if (!ticket) {
    res.status(404).json({
      error: "Ticket not found",
      ticketId: req.params.ticketId
    });
    return;
  }

  const { text, author } = req.body ?? {};

  if (!text) {
    res.status(400).json({
      error: "text is required"
    });
    return;
  }

  const comment: TicketComment = {
    id: `COMMENT-${randomInt(1000, 9999)}`,
    author: author ?? "agent",
    text,
    createdAt: new Date().toISOString()
  };

  ticket.comments.push(comment);
  ticket.updatedAt = comment.createdAt;

  res.json({
    ticketId: ticket.ticketId,
    status: ticket.status,
    comment,
    comments: ticket.comments
  });
});

app.patch("/tickets/:ticketId/status", (req, res) => {
  const ticket = tickets.get(req.params.ticketId);

  if (!ticket) {
    res.status(404).json({
      error: "Ticket not found",
      ticketId: req.params.ticketId
    });
    return;
  }

  const { status, comment } = req.body ?? {};
  const allowedStatuses: TicketStatus[] = [
    "Created",
    "In Progress",
    "Waiting for Customer",
    "Resolved",
    "Closed"
  ];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({
      error: "status is required and must be a valid demo status",
      allowedStatuses
    });
    return;
  }

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  if (comment) {
    ticket.comments.push({
      id: `COMMENT-${randomInt(1000, 9999)}`,
      author: "agent",
      text: comment,
      createdAt: ticket.updatedAt
    });
  }

  res.json(ticket);
});

app.get("/users/resolve", (req, res) => {
  const email = typeof req.query.email === "string" ? req.query.email : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const localPart = email?.split("@")[0] ?? userId ?? "demo.user";

  res.json({
    requesterId: userId ?? `REQ-${localPart.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase()}`,
    displayName:
      localPart
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
        .join(" ") || "Demo User",
    email: email ?? `${localPart}@example.com`,
    department: "Demo Support",
    location: "Norway",
    vip: false
  });
});

app.post("/mcp", async (req, res) => {
  try {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader)
      ? sessionIdHeader[0]
      : sessionIdHeader;

    let session = sessionId ? mcpSessions[sessionId] : undefined;
    const isInitialization = isInitializeRequest(req.body);

    if (!session && isInitialization) {
      const server = createMcpServer();
      let transport: StreamableHTTPServerTransport;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (newSessionId) => {
          mcpSessions[newSessionId] = {
            server,
            transport
          };
        },
        onsessionclosed: async (closedSessionId) => {
          const closedSession = mcpSessions[closedSessionId];
          delete mcpSessions[closedSessionId];

          await closedSession?.server.close();
        }
      });

      await server.connect(transport);
      session = {
        server,
        transport
      };
    }

    if (!session) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: initialize first, then pass Mcp-Session-Id."
        },
        id: null
      });
      return;
    }

    const { transport } = session;
    await transport.handleRequest(req, res, req.body);

    if (isInitialization && transport.sessionId) {
      mcpSessions[transport.sessionId] = session;
    }
  } catch (error) {
    console.error("Error handling MCP request:", error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST for Streamable HTTP MCP."
    },
    id: null
  });
});

app.delete("/mcp", async (req, res) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId = Array.isArray(sessionIdHeader)
    ? sessionIdHeader[0]
    : sessionIdHeader;

  const session = sessionId ? mcpSessions[sessionId] : undefined;

  if (!session) {
    res.status(404).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Session not found."
      },
      id: null
    });
    return;
  }

  await session.transport.handleRequest(req, res);
  delete mcpSessions[sessionId as string];
  await session.server.close();
});

app.listen(port, () => {
  console.log(`Fake API running on ${publicBaseUrl}`);
  console.log(`OpenAPI: ${publicBaseUrl}/openapi.json`);
  console.log(`MCP: ${publicBaseUrl}/mcp`);
});
