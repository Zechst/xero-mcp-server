#!/usr/bin/env node
import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolFactory } from "./tools/tool-factory.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;

const TEMP_DIR = "/tmp/xero-uploads";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      cb(null, TEMP_DIR);
    },
    filename: (req, _file, cb) => {
      const fileName = (req.body?.fileName as string | undefined) ?? _file.originalname;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — Xero's attachment size limit
});

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

app.post("/upload-temp", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Send a multipart/form-data POST with a 'file' field." });
    return;
  }
  const tempPath = path.join(TEMP_DIR, req.file.filename);
  res.json({ tempPath });
});

app.post("/delete-temp", (req, res) => {
  const { tempPath } = req.body as { tempPath?: string };
  if (!tempPath) {
    res.status(400).json({ error: "Missing tempPath in request body." });
    return;
  }
  // Restrict deletion to TEMP_DIR only
  const resolved = path.resolve(tempPath);
  if (!resolved.startsWith(path.resolve(TEMP_DIR))) {
    res.status(403).json({ error: "Path is outside the temp directory." });
    return;
  }
  try {
    fs.unlinkSync(resolved);
    res.json({ deleted: true });
  } catch {
    res.status(404).json({ deleted: false, error: "File not found or already deleted." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.error(`Xero MCP Server (HTTP) listening on port ${PORT}`);
});
