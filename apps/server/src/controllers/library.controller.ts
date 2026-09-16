import type { FastifyReply, FastifyRequest } from "fastify";
import { createJob } from "../services/jobs/job.service.js";
import * as libraryService from "../services/library/library.service.js"

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

    return reply.code(202).send({
        job_id: job?.id,
        status: job?.status,
    });
}

type GetArtistsQuery = {
    page?: number;
    limit?: number;
}

export async function getArtists(
    request: FastifyRequest<{Querystring: GetArtistsQuery}>,
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

type GetAlbumsQuery = {
    page?: number;
    limit?: number;
}

export async function getAlbums(
    request: FastifyRequest<{Querystring: GetAlbumsQuery}>,
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


