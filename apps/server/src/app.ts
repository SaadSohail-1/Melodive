import Fastify from "fastify";
import databasePlugin from "./plugins/database.js";
import healthRoute from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import userRoutes from "./routes/user.routes.js";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";
import authPlugin from "./plugins/auth.js";

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
    await fastify.register(userRoutes, {
        prefix: "/api/users"
    });
    await fastify.register(libraryRoutes, {
        prefix: "/api/library",
    });

    return fastify;
}


