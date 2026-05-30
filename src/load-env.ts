import { config } from "dotenv";

config({ path: ".env", quiet: true, override: true });
config({ path: ".env.local", quiet: true, override: true });
