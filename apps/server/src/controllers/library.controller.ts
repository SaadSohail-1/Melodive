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

export async function getArtists(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const artists = await libraryService.getArtists();
    return reply.code(200).send({
        artists,
    })
}