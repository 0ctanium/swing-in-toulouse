import { config } from "dotenv";

// ENV_FILE points a one-off script at another environment (docs/runbook.md § 3.3) instead of
// the development files, which otherwise override the shell.
if (process.env.ENV_FILE) {
  config({ path: process.env.ENV_FILE, quiet: true, override: true });
} else if (process.env.NODE_ENV !== "test") {
  config({ path: ".env", quiet: true, override: true });
  config({ path: ".env.local", quiet: true, override: true });
}
