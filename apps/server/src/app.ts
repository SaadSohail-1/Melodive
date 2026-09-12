import Fastify from "fastify";
import databasePlugin from "./plugins/database.js";
import healthRoute from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import libraryRoutes from "./routes/library.js";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import authPlugin from "./plugins/auth.js";
import meRoute from "./routes/me.js";

export async function buildApp() {
    const fastify = Fastify({
        logger: true
    })

    await fastify.register(sensible);
    await fastify.register(cookie)
    await fastify.register(databasePlugin);
    await fastify.register(authPlugin)
    await fastify.register(healthRoute);
    await fastify.register(authRoutes, {
        prefix: "/api/auth",
    });
    await fastify.register(meRoute, {
        prefix: "/api/users"
    });
    await fastify.register(libraryRoutes, {
        prefix: "/api/library",
    });

    return fastify;
}


