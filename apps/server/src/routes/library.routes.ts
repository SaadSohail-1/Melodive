import type { FastifyPluginAsync } from "fastify";
import { 
    getArtists, 
    scanLibrary,
} from "../controllers/library.controller.js";

const scanLibraryOpts = {
    schema: {
        body: {
            type: "object",
            required: ["path"],
            properties: {
                path: {
                    type: "string", minLength: 1,
                },
            },
        },
    },
}

const libraryRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post("/scan", scanLibraryOpts, scanLibrary);
    fastify.get("/artists", getArtists);
}

export default libraryRoutes;