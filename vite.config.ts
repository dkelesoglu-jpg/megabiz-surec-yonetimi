import vinext from "vinext";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const VERCEL_ENV_MODULE = "\0vercel-cloudflare-workers";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
};

export default defineConfig(async () => {
  const isVercel =
    process.env.VERCEL === "1" || process.env.NITRO_PRESET === "vercel";

  if (isVercel) {
    const { nitro } = await import("nitro/vite");

    return {
      resolve: {
        alias: {
          tailwindcss: resolve("node_modules/tailwindcss/index.css"),
        },
      },
      plugins: [
        {
          name: "vercel-cloudflare-workers-env",
          enforce: "pre",
          resolveId(id) {
            return id === "cloudflare:workers" ? VERCEL_ENV_MODULE : null;
          },
          load(id) {
            return id === VERCEL_ENV_MODULE
              ? "export const env = process.env;"
              : null;
          },
        },
        vinext(),
        nitro(),
      ],
    };
  }

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
