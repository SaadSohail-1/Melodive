import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import pg from "pg";

console.log("ENV:", {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
});

const { Client } = pg;

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

try {
  await client.connect();
  console.log("CONNECTED!");
  await client.end();
} catch (error) {
  console.error("FAILED:", error);
}