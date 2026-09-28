import type { FastifyReply, FastifyRequest } from "fastify";
import * as userService from "../services/user/user.service.js";

export async function getMe(
    request: FastifyRequest,
    reply: FastifyReply
) {
    return reply.code(200).send({
        success: true,
        data: {
            userId: request.user
        }
    })
}

export async function getPlaybackState(
    request: FastifyRequest,
    reply: FastifyReply
) { 
    if(!request.user) return null;
    const result = await userService.getPlaybackState(request.user);
    if(!result) return reply.code(404).send({
        data: []
    })
    return reply.code(200).send({
        success: true,
        data: {
            trackId: result.trackId,
            positionSeconds: result.positionSeconds,
            isPlaying: result.isPlaying
        }
    });
}

export type setPlaybackStateBody = {
    trackId: string;
    positionSeconds: string;
}

export async function setPlaybackState(
    request: FastifyRequest<{Body: setPlaybackStateBody}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {trackId, positionSeconds} = request.body;
    
    await userService.setPlaybackState(
        request.user, 
        trackId, 
        positionSeconds
    );

    return reply.code(200).send({
        success: true,
        message: "Playback state saved"
    })
}

export type CreateListeningEventBody = {
    trackId: string;
    playedDurationSeconds: string;
}

export async function createListeningEvent(
    request: FastifyRequest<{Body: CreateListeningEventBody}>,
    reply: FastifyReply
) {
    if(!request.user) return null;   
    const userId = request.user;
    const {trackId, playedDurationSeconds} = request.body;
    await userService.createListeningEvent(userId, trackId, playedDurationSeconds);
    return reply.code(201).send({
        success: true,
        message: "Listening event saved successfully"
    });
}

export type GetListeningEventsQuery = {
    page?: number;
    limit?: number;
}

export async function getListeningEvents(
    request: FastifyRequest<{
        Querystring: {
            page?: number;
            limit?: number;
        }
    }>,
    reply: FastifyReply
) {
    if(!request.user) return null;

    const page = request.query.page ?? 1;
    const limit = request.query.limit ?? 20;

    const {result, total} = await userService.getListeningEvents(request.user, page, limit);
    return reply.code(200).send({
        success: true,
        data: result,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit),
        }
    })
}

export type FavoriteParams = {
    id: string;
}

export async function setFavoriteTrack(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) { 
    if(!request.user) return null;
    const {id} = request.params;
    await userService.setFavoriteTrack(request.user, id);
    return reply.code(201).send({
        success: true,
        message: "Track favorited successfully"
    })
}

export async function deleteFavoriteTrack(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {id} = request.params;
    await userService.deleteFavoriteTrack(request.user, id);
    return reply.code(204).send({
        success: true,
        message: "Track deleted from favorites"
    })
}

export async function setFavoriteAlbum(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) { 
    if(!request.user) return null;
    const {id} = request.params;
    await userService.setFavoriteAlbum(request.user, id);
    return reply.code(201).send({
        success: true,
        message: "Album favorited successfully"
    })
}

export async function deleteFavoriteAlbum(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {id} = request.params;
    await userService.deleteFavoriteAlbum(request.user, id);
    return reply.code(204).send({
        success: true,
        message: "Track deleted from favorites"
    })
}

export async function setFavoriteArtist(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) { 
    if(!request.user) return null;
    const {id} = request.params;
    await userService.setFavoriteArtist(request.user, id);
    return reply.code(201).send({
        success: true,
        message: "Artist favorited successfully"
    })
}

export async function deleteFavoriteArtist(
    request: FastifyRequest<{Params: FavoriteParams}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {id} = request.params;
    await userService.deleteFavoriteArtist(request.user, id);
    return reply.code(204).send({
        success: true,
        message: "Track deleted from favorites"
    })
}