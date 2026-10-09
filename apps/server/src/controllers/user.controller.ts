import type { FastifyReply, FastifyRequest } from "fastify";
import * as userService from "../services/user/user.service.js";
import type {
    SetPlaybackStateBody,
    CreateListeningEventBody,
    GetListeningEventsQuery,
    FavoriteParams,
    CreatePlaylistBody,
    UpdatePlaylistBody,
    UpdatePlaylistParams,
    DeletePlaylistParams
} from "../types/user.types.js"

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

export async function setPlaybackState(
    request: FastifyRequest<{Body: SetPlaybackStateBody}>,
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

export async function getFavoriteTracks(
    request: FastifyRequest,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const result = await userService.getFavoriteTracks(request.user);
    return reply.code(200).send({
        success: true,
        data: result
    })   
}

export async function getFavoriteAlbums(
    request: FastifyRequest,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const result = await userService.getFavoriteAlbums(request.user);
    return reply.code(200).send({
        success: true,
        data: result
    })       
}

export async function getFavoriteArtists(
    request: FastifyRequest,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const result = await userService.getFavoriteArtists(request.user);
    return reply.code(200).send({
        success: true,
        data: result
    })       
}

export async function createPlaylist(
    request: FastifyRequest<{Body: CreatePlaylistBody}>,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const {name, description, coverImagePath} = request.body;
    await userService.createPlaylist(request.user, name, description, coverImagePath);
    return reply.code(200).send({
        success: true,
        message: "Playlist created successfully"
    })
}

export async function getPlaylists(
    request: FastifyRequest,
    reply: FastifyReply
) {
    if(!request.user) return null;
    const playlists = await userService.getPlaylists(request.user);
    return reply.code(200).send({
        success: true,
        data: playlists
    })
}

export async function updatePlaylist(
    request: FastifyRequest<{
        Body: UpdatePlaylistBody,
        Params: UpdatePlaylistParams 
    }>,
    reply: FastifyReply
) {
    const id = request.params.id;
    const {name, description, isPublic} = request.body;
    await userService.updatePlaylist(id, name, description, isPublic);
    return reply.code(200).send({
        success: true,
        message: "Playlist updated successfully"
    })
}

export async function deletePlaylist(
    request: FastifyRequest<{Params: DeletePlaylistParams}>,
    reply: FastifyReply
) {
    const id = request.params.id;
    await userService.deletePlaylist(id);
    return reply.code(204).send();
}