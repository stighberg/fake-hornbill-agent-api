import { createServer } from "node:http";
import { randomInt } from "node:crypto";

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

function sendJson(res: any, statusCode: number, body: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify(body, null, 2));
}

async function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });

    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/openapi.json") {
      sendJson(res, 200, openApiDocument);
      return;
    }

    if (req.method === "POST" && req.url === "/tickets") {
      const body = await readBody(req);

      const { title, description, priority, requesterId } = body;

      if (!title || !description) {
        sendJson(res, 400, {
          error: "title and description are required"
        });
        return;
      }

      const id = randomInt(100000, 999999);
      const externalTicketId = `FAKE-${id}`;

      sendJson(res, 201, {
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

      return;
    }

    sendJson(res, 404, {
      error: "Not found"
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, () => {
  console.log(`Fake API running on ${publicBaseUrl}`);
  console.log(`OpenAPI: ${publicBaseUrl}/openapi.json`);
});
