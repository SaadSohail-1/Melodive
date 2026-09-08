import type { FastifyRequest } from "fastify";
import type {db} from "../db/index.js";

declare module "fastify" {
    interface FastifyInstance {
        db: typeof db;

        authenticate: (request: FastifyRequest ) => Promise<void>;
    }

    interface FastifyRequest{
        user: string | null;
    }
}