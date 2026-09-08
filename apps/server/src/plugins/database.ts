import fp from "fastify-plugin";
import {db} from "../db/index.js";

export  default fp(async (fastify) => {
    fastify.decorate("db", db);
})