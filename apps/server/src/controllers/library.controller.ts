import type { FastifyReply, FastifyRequest } from "fastify";
import { createJob } from "../services/jobs/job.service.js";
import * as libraryService from "../services/library/library.service.js"
import { logger } from "../config/logger.js";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

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

export async function streamTrack(
    request: FastifyRequest<{
        Params: {
            id: string
        }
    }>,
    reply: FastifyReply
) {
    const {id} = request.params;
    const track = await libraryService.getTrackForStreaming(id);

    if(!track){
        return reply.code(404).send({
            error: "Track not found"
        })
    }

    try {
        const file = await stat(track.filePath);
        if(!file.isFile()){
            return reply.code(404).send({
                error: "Audio file not found"
            });
        }
    } catch (error) {
        return reply.code(404).send({
            error: "Audio file not found"
        })
    }

    const fileSize = Number(track.fileSizeBytes);
    const range = request.headers.range;

    if(!range) {
        const stream = createReadStream(track.filePath);
        return reply
            .code(200)
            .header("Content-Type", getAudioContentType(track.format))
            .header("Content-Length", fileSize)
            .header("Accept-Ranges", "bytes")
            .send(stream);
    }

    const match = range.match(/^bytes=(\d*)-(\d*)$/) //parsing range header
    if(!match) {
        return reply
            .code(416)
            .header("Content-Range", `bytes */${fileSize}`)
            .send();
    }

    const start = match[1] ? Number(match[1]) : 0;

    let end = match[2] ? Number(match[2]) : fileSize - 1;

    if(start >= fileSize || start > end) {
        return reply
            .code(416)
            .header("Content-Range", `bytes */${fileSize}`)
            .send()
    }

    end = Math.min(end, fileSize - 1);

    const chunkSize = end - start + 1;

    const stream = createReadStream(track.filePath, {
        start,
        end
    })

    return reply
        .code(206)
        .header("Content-Type", getAudioContentType(track.format))
        .header("Accept-Ranges", "bytes")
        .header("Content-Range", `bytes ${start}-${end}/${fileSize}`)
        .header("Content-Length", chunkSize)
        .send(stream);
}

function getAudioContentType(format: string | null) {
    switch(format?.toLowerCase()) {
        case "mp3":
            return "audio/mpeg";

        case "flac":
            return "audio/flac";

        case "wav":
            return "audio/wav";
        
        case "ogg":
            return "audio/ogg";

        case "m4a":
        case "mp4":
            return "audio/mp4";

        default:
            return "application/octet-stream";
    }
}