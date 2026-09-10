import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema.js";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(pool, { schema });

export { pool };

export * from "./schema.js";