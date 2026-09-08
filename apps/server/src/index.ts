import { buildApp } from "./app.js";

const fastify = await buildApp();

try {
    await fastify.listen({
        port: 3000,
        host: "0.0.0.0"
    });
} catch (error) {
    fastify.log.error(error);
    process.exit(1);
}