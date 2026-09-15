import type { FastifyErrorCodes, FastifyReply, FastifyRequest } from "fastify";
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
      artists,
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