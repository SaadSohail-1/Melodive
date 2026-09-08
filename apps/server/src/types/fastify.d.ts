import type {db} from "../db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: typeof db;
    }
}