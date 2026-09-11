import type {db} from "@melodive/db";
import type { FastifyReply } from "fastify";

declare module "fastify" {
    interface FastifyRequest {
        user: string | null;
    }

    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
    ) => Promise<void>;
    db: typeof db;
    }
}