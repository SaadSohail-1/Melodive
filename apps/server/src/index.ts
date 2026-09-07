import Fastify from "fastify"
import {pool} from "./config/database.js"

const fastify = Fastify({
    logger: true
})

fastify.get("/health", async () => {
    const result = await pool.query("SELECT NOW()");

    return {
        status: "ok",
        database: result.rows[0]
    };
});

const start = async () => {
    try {
        await fastify.listen({port: 3000})
    } catch (error) {
        fastify.log.error(error);
        process.exit(1)
    }
};

start();