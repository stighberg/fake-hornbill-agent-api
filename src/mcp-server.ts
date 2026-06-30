import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

type OpenApiDocument = {
  servers?: Array<{ url: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
};

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

const openApiUrl =
  process.env.OPENAPI_URL ?? "http://localhost:3001/openapi.json";

const fallbackApiBaseUrl =
  process.env.API_BASE_URL ?? "http://localhost:3001";

let discoveredTools: DiscoveredTool[] = [];

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

  const url = `${tool.baseUrl}${tool.path}`;

  const response = await fetch(url, {
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

async function discoverTools(): Promise<DiscoveredTool[]> {
  const response = await fetch(openApiUrl);

  if (!response.ok) {
    throw new Error(`Could not fetch OpenAPI document: ${response.status}`);
  }

  const document = (await response.json()) as OpenApiDocument;
  const baseUrl = document.servers?.[0]?.url ?? fallbackApiBaseUrl;

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
        operation.requestBody?.content?.["application/json"]?.schema ??
        {
          type: "object",
          properties: {},
          required: []
        };

      const name =
        operation["x-mcp-name"] ??
        operation.operationId ??
        `${method}_${path.replaceAll("/", "_").replaceAll("{", "").replaceAll("}", "")}`;

      const description =
        operation["x-mcp-description"] ??
        operation.description ??
        operation.summary ??
        name;

      tools.push({
        name,
        description,
        inputSchema,
        method,
        path,
        baseUrl
      });
    }
  }

  return tools;
}

async function main() {
  discoveredTools = await discoverTools();

  console.error("Discovered MCP tools:");
  for (const tool of discoveredTools) {
    console.error(`- ${tool.name} ${tool.method.toUpperCase()} ${tool.path}`);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
