import fp from "fastify-plugin";
import { getSession } from "../services/auth/session.service.js";
import type { FastifyRequest } from "fastify";

export default fp(async (fastify) => {
    fastify.decorateRequest("user", null);

    fastify.decorate("authenticate", async(request: FastifyRequest) => {
        const token = request.cookies.session;
        if(!token) {
            throw fastify.httpErrors.unauthorized()
        };
        const session = await getSession(token);

        if(!session) throw fastify.httpErrors.unauthorized();

        request.user = session.userId
    })
})