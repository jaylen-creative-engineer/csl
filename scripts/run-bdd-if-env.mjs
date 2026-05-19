import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

config({ path: ".env.local" });

const urlOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
const keyOk = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

const root = dirname(dirname(fileURLToPath(import.meta.url)));

if (!urlOk || !keyOk) {
  console.warn(
    "Skipping Cucumber BDD: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.local.example)"
  );
  process.exit(0);
}

const cucumberBin = join(root, "node_modules", ".bin", "cucumber-js");

const result = spawnSync(cucumberBin, ["--config", "cucumber.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--import tsx" },
});

process.exit(result.status === null ? 1 : result.status);
