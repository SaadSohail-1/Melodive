import type {FastifyPluginAsync} from "fastify";


const meRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get("/me", { onRequest: [fastify.authenticate]}, 
        async(request) => {
            return {
                userId: request.user,
            }
        }
)}

export default meRoute;