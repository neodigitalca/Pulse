const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const {
  PRODUCTION_API_TARGET,
  resolveDevApiTarget,
  isLocalWpProxyTarget,
} = require("./resolve-dev-api-target.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const LOCAL_CONFIG = path.join(REPO_ROOT, "scripts", "local-wp-staging.config.json");

function probeApiBase(apiBase, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL("/api/auth/me", apiBase);
    } catch {
      resolve(false);
      return;
    }
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        method: "GET",
        timeout: timeoutMs,
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume();
        // 401/403 = API alive; 404 = wrong host or WP without neo-pulse routes
        resolve(res.statusCode != null && res.statusCode !== 404);
      },
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
    req.end();
  });
}

/**
 * Pick Vite /api proxy target: local neopulse.local when Docker is up, else production.
 */
async function resolvePulseDevApiTarget() {
  const configured = resolveDevApiTarget();
  const hasLocalConfig = fs.existsSync(LOCAL_CONFIG);

  if (!hasLocalConfig || !isLocalWpProxyTarget(configured)) {
    return { target: PRODUCTION_API_TARGET, mode: "production" };
  }

  const localOk = await probeApiBase(configured);
  if (localOk) {
    return { target: configured, mode: "local-wp" };
  }

  return { target: PRODUCTION_API_TARGET, mode: "production-fallback" };
}

module.exports = {
  probeApiBase,
  resolvePulseDevApiTarget,
  PRODUCTION_API_TARGET,
};
