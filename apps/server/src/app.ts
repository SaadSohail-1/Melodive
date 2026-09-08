import Fastify from "fastify";
import databasePlugin from "./plugins/database.js";
import healthRoute from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import cookie from "@fastify/cookie";

export async function buildApp() {
    const fastify = Fastify({
        logger: true
    })

    await fastify.register(cookie)
    await fastify.register(databasePlugin);
    await fastify.register(healthRoute);
    await fastify.register(authRoutes, {
        prefix: "/api/auth",
    });

    return fastify;
}


