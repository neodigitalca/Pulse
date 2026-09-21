#!/usr/bin/env node
const { spawnSync, execSync } = require("child_process");
const { resolveDevApiTarget } = require("./resolve-dev-api-target.cjs");

if (!process.env.VITE_LOCAL_API_TARGET?.trim()) {
  process.env.VITE_LOCAL_API_TARGET = resolveDevApiTarget();
}
process.env.VITE_MCP_API_BASE = process.env.VITE_MCP_API_BASE || "/api/mcp";

let gitSha = "unknown";
try {
  gitSha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  /* not a git checkout */
}

const apiTarget = process.env.VITE_LOCAL_API_TARGET;
console.log("");
console.log("[neo-pulse dev] UI git:", gitSha, "| API:", apiTarget);
console.log("[neo-pulse dev] Polish menu: any tab → AISEO → Content → Polish → Short");
console.log("[neo-pulse dev] http://localhost:8080  (stop other Vite on 8080 first)");
console.log("");

spawnSync("vite", [], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});
