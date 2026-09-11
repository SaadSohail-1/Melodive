import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "node:path" 
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(__dirname, "../../.env");
const result = config({path: envPath});

export default defineConfig({
  dialect: "postgresql",
  schema: "../../packages/db/src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});