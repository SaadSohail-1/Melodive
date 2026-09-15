import type { FastifyPluginAsync } from "fastify";
import { 
    getArtists, 
    scanLibrary,
    getArtist,
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

const getArtistsOpts = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                },
                limit: {
                    type: "integer",
                    minimum: 1,
                    maximum: 100,
                    default: 20,
                },
            },
        },
        response: {
            200: {
                type: "object",
                required: ["artists", "pagination"],
                properties: {
                    artists: {
                        type: "array",
                        items: {
                            type: "object",
                            required: [
                                "id", "name", "imagePath", "albumCount", "trackCount"
                            ],
                            properties: {
                                id: {type: "string"},
                                name: {type: "string"},
                                imagePath: {
                                    type: ["string", "null"]
                                },
                                albumCount: {type: "integer"},
                                trackCount: {type: "integer"},
                            },
                        }
                    },
                    pagination: {
                        type: "object",
                        required: [
                            "page", "limit", "total", "totalPages"
                        ],
                        properties: {
                            page: {type: "integer"},
                            limit: {type: "integer"},
                            total: {type: "integer"},
                            totalPages: {type: "integer"},
                        },
                    }
                },
            }
        }
    }
}

const getArtistOpts = {
    schema: {
        params: {
            type: "object",
            required: ["id"],
            properties: {
                id:{
                    type: "string",
                    format: "uuid"
                }
            }
        }
    }
}

const libraryRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.post("/scan", scanLibraryOpts, scanLibrary);
    //artists endpoints
    fastify.get("/artists", getArtistsOpts, getArtists);
    fastify.get("/artists/:id", getArtistOpts, getArtist);
    //album endpoints
}

export default libraryRoutes;