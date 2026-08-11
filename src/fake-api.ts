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
    }
  }
};

type OpenApiDocument = typeof openApiDocument;

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
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation["x-mcp-enabled"] !== true) {
        continue;
      }

      if (method.toLowerCase() !== "post") {
        continue;
      }

      const inputSchema =
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

    const response = await fetch(`${tool.baseUrl}${tool.path}`, {
      method: tool.method.toUpperCase(),
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args)
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

  res.status(201).json({
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

app.post("/mcp", async (req, res) => {
  try {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = Array.isArray(sessionIdHeader)
      ? sessionIdHeader[0]
      : sessionIdHeader;

    let session = sessionId ? mcpSessions[sessionId] : undefined;

    if (!session && isInitializeRequest(req.body)) {
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
