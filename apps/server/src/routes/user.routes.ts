import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import * as userController from "../controllers/user.controller.js"
import type { setPlaybackStateBody, CreateListeningEventBody, GetListeningEventsQuery } from "../controllers/user.controller.js";

const setPlaybackStateOpts = (fastify: FastifyInstance) => ({
    schema: {
        body: {
            type: "object",
            required: ["trackId","positionSeconds"],
            properties: {
                trackId: {type: "string"},
                positionSeconds: {type: "string"}
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const createListeningEventOpts = (fastify: FastifyInstance) => ({
    schema: {
        body: {
            type:"object",
            required: ["trackId", "playedDurationSeconds"],
            properties: {
                trackId: {type: "string", format: "uuid"},
                playedDurationSeconds: {type: "string", pattern: "^(?:0|[1-9]\\d*)(?:\\.\\d{1,3})?$"},
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const getListeningEventsOpts = (fastify:FastifyInstance) => ({
    schema: {
        querystring: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    minimum: 1,
                    default: 1
                },
                limit: {
                    type: "integer",
                    maximum: 100,
                    default: 20
                }
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const userRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/me", { onRequest: [fastify.authenticate]}, userController.getMe);
    fastify.get("/playback",{onRequest: [fastify.authenticate]}, userController.getPlaybackState);
    fastify.put<{Body: setPlaybackStateBody}>("/playback", setPlaybackStateOpts(fastify), userController.setPlaybackState);
    fastify.post<{Body: CreateListeningEventBody}>("/listening-event", createListeningEventOpts(fastify), userController.createListeningEvent);
    fastify.get<{Querystring: GetListeningEventsQuery}>("/listening-events", getListeningEventsOpts(fastify) , userController.getListeningEvents);
}

export default userRoutes;