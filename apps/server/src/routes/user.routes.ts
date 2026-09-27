import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { 
    getMe, 
    getPlaybackState, 
    setPlaybackState
} from "../controllers/user.controller.js"
import { type setPlaybackStateBody } from "../controllers/user.controller.js";

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

const userRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/me", { onRequest: [fastify.authenticate]}, getMe);
    fastify.get("/playback",{onRequest: [fastify.authenticate]}, getPlaybackState);
    fastify.put<{Body: setPlaybackStateBody}>("/playback", setPlaybackStateOpts(fastify), setPlaybackState);
}

export default userRoutes;