#!/usr/bin/env node
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolFactory } from "./tools/tool-factory.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;

function createServer(): McpServer {
  const server = new McpServer({
    name: "Xero MCP Server",
    version: "1.0.0",
  });
  ToolFactory(server);
  return server;
}

app.all("/mcp", async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.error(`Xero MCP Server (HTTP) listening on port ${PORT}`);
});
