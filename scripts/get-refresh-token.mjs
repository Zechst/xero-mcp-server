#!/usr/bin/env node
/**
 * One-shot script to get a Xero refresh token via OAuth2 authorization code flow.
 * Starts a local server on port 8888 to catch the callback.
 * Usage: node scripts/get-refresh-token.mjs
 */
import http from "http";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env manually
const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.trim().split("=");
    if (key && rest.length) process.env[key] = rest.join("=");
  }
} catch { /* no .env */ }

const CLIENT_ID = process.env.XERO_CLIENT_ID;
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:8888/callback";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.invoices",
  "accounting.payments",
  "accounting.banktransactions",
  "accounting.manualjournals",
  "accounting.journals.read",
  "accounting.reports.aged.read",
  "accounting.reports.balancesheet.read",
  "accounting.reports.profitandloss.read",
  "accounting.reports.trialbalance.read",
  "accounting.reports.banksummary.read",
  "assets",
  "accounting.contacts",
  "accounting.settings",
  "accounting.attachments",
  "payroll.settings",
  "payroll.employees",
  "payroll.timesheets",
  "files",
].join(" ");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: XERO_CLIENT_ID and XERO_CLIENT_SECRET must be set in .env");
  process.exit(1);
}

const authUrl =
  `https://login.xero.com/identity/connect/authorize` +
  `?response_type=code` +
  `&client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&state=xero_mcp`;

console.log("\nOpening Xero login in your browser...");
console.log("Auth URL:", authUrl, "\n");

try {
  execSync(`open "${authUrl}"`);
} catch {
  console.log("Could not open browser automatically. Please open the URL above manually.");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:8888`);
  if (url.pathname !== "/callback") {
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.end(`<h2>Error: ${error}</h2>`);
    console.error("OAuth error:", error);
    server.close();
    return;
  }

  if (!code) {
    res.end("<h2>No code received</h2>");
    server.close();
    return;
  }

  // Exchange code for tokens
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  try {
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      res.end(`<h2>Token error: ${tokens.error}</h2><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
      console.error("Token error:", tokens);
      server.close();
      return;
    }

    console.log("\n=== SUCCESS ===");
    console.log("Refresh Token:", tokens.refresh_token);
    console.log("\nSet this in Render as XERO_REFRESH_TOKEN:");
    console.log(tokens.refresh_token);
    console.log("===============\n");

    res.end(`
      <h2>Success!</h2>
      <p>Refresh token obtained. You can close this tab.</p>
      <pre>${JSON.stringify({ refresh_token: tokens.refresh_token, expires_in: tokens.expires_in }, null, 2)}</pre>
    `);
  } catch (err) {
    res.end(`<h2>Fetch error</h2><pre>${err.message}</pre>`);
    console.error("Fetch error:", err);
  }

  server.close();
});

server.listen(8888, () => {
  console.log("Waiting for Xero callback on http://localhost:8888/callback ...");
});
