import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import * as userController from "../controllers/user.controller.js"
import type { 
    SetPlaybackStateBody, 
    CreateListeningEventBody, 
    GetListeningEventsQuery, 
    FavoriteParams, 
    CreatePlaylistBody,
    UpdatePlaylistBody,
    UpdatePlaylistParams,
    DeletePlaylistParams,
    AddPlaylistTrackBody,
    AddPlaylistTrackParams,
    GetPlaylistParams,
    DeletePlaylistTrackParams
} from "../types/user.types.js";

const setPlaybackStateOpts = (fastify: FastifyInstance) => ({
    schema: {
        body: {
            type: "object",
            required: ["trackId","positionSeconds"],
            properties: {
                trackId: {type: "string"},
                positionSeconds: {type: "string"}
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const createListeningEventOpts = (fastify: FastifyInstance) => ({
    schema: {
        body: {
            type:"object",
            required: ["trackId", "playedDurationSeconds"],
            properties: {
                trackId: {type: "string", format: "uuid"},
                playedDurationSeconds: {type: "string", pattern: "^(?:0|[1-9]\\d*)(?:\\.\\d{1,3})?$"},
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const getListeningEventsOpts = (fastify:FastifyInstance) => ({
    schema: {
        querystring: {
            type: "object",
            properties: {
                page: {
                    type: "integer",
                    minimum: 1,
                    default: 1
                },
                limit: {
                    type: "integer",
                    maximum: 100,
                    default: 20
                }
            }
        }
    },
    onRequest: [fastify.authenticate]
})

const setFavoriteOpts = (fastify: FastifyInstance) => ({
    schema: {

    },
    onRequest: [fastify.authenticate]
})




const userRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/me", { onRequest: [fastify.authenticate]}, userController.getMe);
    //playback states
    fastify.get("/playback",{onRequest: [fastify.authenticate]}, userController.getPlaybackState);
    fastify.put<{Body: SetPlaybackStateBody}>("/playback", setPlaybackStateOpts(fastify), userController.setPlaybackState);
    //listening events
    fastify.post<{Body: CreateListeningEventBody}>("/listening-event", createListeningEventOpts(fastify), userController.createListeningEvent);
    fastify.get<{Querystring: GetListeningEventsQuery}>("/listening-events", getListeningEventsOpts(fastify) , userController.getListeningEvents);
    //favorites (post and delete)
    fastify.post<{Params: FavoriteParams}>("/favorites/tracks/:id", {onRequest: [fastify.authenticate]} ,userController.setFavoriteTrack);
    fastify.delete<{Params: FavoriteParams}>("/favorites/tracks/:id", {onRequest: [fastify.authenticate]}, userController.deleteFavoriteTrack);
    fastify.post<{Params: FavoriteParams}>("/favorites/albums/:id", {onRequest: [fastify.authenticate]} ,userController.setFavoriteAlbum);
    fastify.delete<{Params: FavoriteParams}>("/favorites/albums/:id", {onRequest: [fastify.authenticate]}, userController.deleteFavoriteAlbum);
    fastify.post<{Params: FavoriteParams}>("/favorites/artists/:id", {onRequest: [fastify.authenticate]} ,userController.setFavoriteArtist);
    fastify.delete<{Params: FavoriteParams}>("/favorites/artists/:id", {onRequest: [fastify.authenticate]}, userController.deleteFavoriteArtist);
    //retrieve favorites
    fastify.get("/favorites/tracks",{onRequest: [fastify.authenticate]}, userController.getFavoriteTracks);
    fastify.get("/favorites/albums", {onRequest: [fastify.authenticate]}, userController.getFavoriteAlbums);
    fastify.get("/favorites/artists", {onRequest: [fastify.authenticate]}, userController.getFavoriteArtists);
    //playlists
    fastify.post<{Body: CreatePlaylistBody}>("/playlists", {onRequest: [fastify.authenticate]}, userController.createPlaylist);
    fastify.get("/playlists", {onRequest: [fastify.authenticate]}, userController.getPlaylists);
    fastify.get<{Params: GetPlaylistParams}>("/playlists/:id", {onRequest: [fastify.authenticate]}, userController.getPlaylist);
    fastify.put<{Params: UpdatePlaylistParams, Body:UpdatePlaylistBody}>("/playlists/:id", {onRequest: [fastify.authenticate]}, userController.updatePlaylist);
    fastify.delete<{Params: DeletePlaylistParams}>("/playlists/:id", {onRequest: [fastify.authenticate]}, userController.deletePlaylist);
    //playlist tracks
    fastify.post<{Body: AddPlaylistTrackBody, Params: AddPlaylistTrackParams}>("/playlists/:id/tracks", {onRequest: [fastify.authenticate]}, userController.addPlaylistTrack);
    fastify.delete<{Params: DeletePlaylistTrackParams}>("/playlists/:playlistId/tracks/:trackId", {onRequest: [fastify.authenticate]}, userController.deletePlaylistTrack);
}

export default userRoutes;