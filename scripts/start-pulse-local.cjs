#!/usr/bin/env node
/**
 * Start Pulse UI on http://localhost:8080 (Polish menu from src/).
 * Picks /api target: neopulse.local when Docker/WP is up, else neodigital.ca.
 */
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { resolvePulseDevApiTarget, PRODUCTION_API_TARGET } = require("./resolve-pulse-dev-api.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");

function gitShortSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function hasPolishMenuSource() {
  const clusterFile = path.join(REPO_ROOT, "src/lib/overview/overview-bulk-action-clusters.ts");
  if (!fs.existsSync(clusterFile)) return false;
  const text = fs.readFileSync(clusterFile, "utf8");
  return text.includes("content-polish") && text.includes("Polish");
}

async function main() {
  const sha = gitShortSha();
  const polish = hasPolishMenuSource();

  console.log("");
  console.log("=== Pulse local UI ===");
  console.log("git:", sha, polish ? "| Polish menu: YES" : "| Polish menu: MISSING — git pull origin main");
  console.log("");
  console.log("Open: http://localhost:8080/#generator");
  console.log("Then: Opt → AISEO → Content → Polish → Short");
  console.log("");

  if (!polish) {
    console.error("ERROR: This checkout does not contain the Polish menu. Run:");
    console.error("  git fetch origin && git checkout main && git reset --hard origin/main");
    process.exit(1);
  }

  const { target, mode } = await resolvePulseDevApiTarget();

  if (mode === "local-wp") {
    console.log("API: local WordPress at", target);
  } else if (mode === "production-fallback") {
    console.log("API: Docker/WP offline — using production", PRODUCTION_API_TARGET);
    console.log("Sign in with your neodigital.ca account (e.g. pulse@neodigital.ca).");
  } else {
    console.log("API: production", target);
  }
  console.log("");

  const env = {
    ...process.env,
    VITE_LOCAL_API_TARGET: target,
    VITE_MCP_API_BASE: process.env.VITE_MCP_API_BASE || "/api/mcp",
  };

  const child = spawn("vite", [], {
    cwd: REPO_ROOT,
    stdio: "inherit",
    shell: true,
    env,
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
