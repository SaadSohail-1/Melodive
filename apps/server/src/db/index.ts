import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "../config/database.js";

export const db = drizzle(pool);