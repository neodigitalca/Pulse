#!/usr/bin/env node
/**
 * Start Pulse UI on http://localhost:8080 with current repo source (includes AISEO Polish menu).
 * WordPress Docker is optional: use dev:remote if neopulse.local is down.
 */
const { spawn, spawnSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const LOCAL_CONFIG = path.join(REPO_ROOT, "scripts", "local-wp-staging.config.json");

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

const sha = gitShortSha();
const polish = hasPolishMenuSource();

console.log("");
console.log("=== Pulse local UI ===");
console.log("git:", sha, polish ? "| Polish menu: YES in source" : "| Polish menu: MISSING — git pull origin main");
console.log("");
console.log("Open: http://localhost:8080/#generator");
console.log("Then: Opt → AISEO → Content → Polish → Short");
console.log("Flyout footer should show ui", sha.slice(0, 7));
console.log("");

const localWp = fs.existsSync(LOCAL_CONFIG);
if (!localWp) {
  console.log("No scripts/local-wp-staging.config.json — API will use production (dev:remote behavior).");
  console.log("UI menu still works. For offline WP: start Docker + WP Staging, run npm run setup:local-wp");
} else {
  console.log("Local WP config found — Vite will proxy /api to neopulse.local when Docker site is up.");
  console.log("If Docker is stopped, login may fail; use dev:remote or start WP Staging again.");
}
console.log("");

if (!polish) {
  console.error("ERROR: This checkout does not contain the Polish menu. Run:");
  console.error("  git fetch origin && git checkout main && git pull origin main");
  process.exit(1);
}

const child = spawn("node", [path.join(__dirname, "dev-local.cjs")], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
