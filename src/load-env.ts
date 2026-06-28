import { config } from "dotenv";

if (process.env.NODE_ENV !== "test") {
  config({ path: ".env", quiet: true, override: true });
  config({ path: ".env.local", quiet: true, override: true });
}
