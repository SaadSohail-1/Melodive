import type { FastifyReply, FastifyRequest } from "fastify";
import { createJob } from "../services/jobs/job.service.js";
import * as libraryService from "../services/library/library.service.js"
import { logger } from "../config/logger.js";

export async function scanLibrary(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const body = request.body as {
        path?: string
    };

    const job = await createJob(
        "SCAN_LIBRARY",
        {
            path: body.path,
        },
    );

    if(!job) {
        await logger.error("JOB_CREATION_FAILED", {
            details: {
                path: body.path,
                route: "/api/library/scan"
            },
            error: new Error("could not create job")
        })
        return reply.code(500).send({
            error: "could not create job"
        });
    }

    await logger.info("LIBRARY_SCAN_REQUESTED", {
        details: {
            jobId: job.id,
            path: body.path
        }
    })

    return reply.code(202).send({
        job_id: job?.id,
        status: job?.status,
    });
}

export async function getArtists(
    request: FastifyRequest<{
        Querystring: {
            page?: number;
            limit?: number;
        } 
    }>,
    reply: FastifyReply
) {

    const page = request.query.page ?? 1;
    const limit = request.query.limit ?? 20;

    const {artists, total} = await libraryService.getArtists(page, limit);

    return reply.code(200).send({
      data: artists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total/limit),
      }
    })
}

export async function getArtist(
    request: FastifyRequest<{Params: {
        id: string;
    }}>,
    reply: FastifyReply
) {
    const { id } = request.params
    const artist = await libraryService.getArtist(id);

    if(!artist) {
        return reply.code(404).send({
            error: "Artist not found"
        })
    }

    return reply.code(200).send({
        data: artist
    })
}

export async function getAlbums(
    request: FastifyRequest<{
        Querystring: {
            page?: number;
            limit?: number;
        }
    }>,
    reply: FastifyReply
) {
    const page = request.query.page ?? 1;
    const limit = request.query.limit ?? 20;

    const {albums, total} = await libraryService.getAlbums(page, limit);
    return reply.code(200).send({
        data: albums,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit)
        }
    })
}

export async function getAlbum(
    request: FastifyRequest<{Params: { id: string }}>,
    reply: FastifyReply
) {
    const {id} = request.params;
    const album = await libraryService.getAlbum(id);
    if(!album) {
        return reply.code(404).send({
            error: "Album not found"
        });
    }
    return reply.code(200).send({
        data: album
    });
}

export async function getArtistAlbums(
    request: FastifyRequest<{
        Params: {
            id: string}
    }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const albums = await libraryService.getArtistAlbums(id);
    if(!albums) {
        return reply.code(404).send({
            error: "Albums not found"
        })
    }
    return reply.code(200).send({
        data: albums
    })    
}

export async function getAlbumTracks(
    request: FastifyRequest<{
        Params: {
            id: string
        }
    }>,
    reply: FastifyReply
) {
    const {id} = request.params;
    const tracks = await libraryService.getAlbumTracks(id);
    if(!tracks) {
        return reply.code(404).send({
            error: "Tracks not found"
        })
    }
    return reply.code(200).send({
        data: tracks
    })
}

export async function getTracks(
    request: FastifyRequest<{
        Querystring: {
            page?: number,
            limit?: number
        }
    }>,
    reply: FastifyReply
) {
    const page = request.query.page ?? 1;
    const limit = request.query.limit ?? 20;

    const {tracks, total } = await libraryService.getTracks(page, limit);
    return reply.code(200).send({
        data: tracks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit)
        }
    })
}

export async function getTrack(
    request: FastifyRequest<{
        Params: {
            id: string
        }
    }>,
    reply: FastifyReply
) {
    const {id} = request.params;
    const track = await libraryService.getTrack(id);

    if(!track) {
        return reply.code(404).send({
            error: "Track not found."
        })
    }

    return reply.code(200).send({
        data: track
    })
}

export async function searchLibrary(
    request: FastifyRequest<{
        Querystring: {
            q?: string
        }
    }>,
    reply: FastifyReply
) {
    const query = request.query.q?.trim();

    if(!query) {
        return reply.code(400).send({
            error: "Search query is required"
        });
    }
    const results = await libraryService.searchLibrary(query);
    return reply.code(200).send({
        data: results
    })
}