import { db, favorites, listeningEvents, playlists, tracks, userPlaybackStates } from "@melodive/db";
import { eq, count, desc, and, isNotNull } from "drizzle-orm";

export async function getPlaybackState(userId: string) {
    const [result] = await db
        .select({
            trackId: userPlaybackStates.activeTrackId,
            positionSeconds: userPlaybackStates.positionSeconds,
            isPlaying: userPlaybackStates.isPlaying,
        })
        .from(userPlaybackStates)
        .where(eq(userPlaybackStates.userId, userId))
        .limit(1);

    return result ?? null;
}

export async function setPlaybackState(
    userId: string,
    trackId: string,
    positionSeconds: string
) {

    const result = await db
        .insert(userPlaybackStates)
        .values({
            userId,
            activeTrackId: trackId,
            positionSeconds: positionSeconds,
            updatedAt: new Date()
        })
        .onConflictDoUpdate({
            target: userPlaybackStates.userId,
            set: {
                activeTrackId: trackId,
                positionSeconds: positionSeconds,
                updatedAt: new Date()
            }
        })

    return result;
}

export async function createListeningEvent(
    userId: string,
    trackId: string,
    playedDurationSeconds: string,
) {

    const [track] = await db
        .select({durationSeconds: tracks.durationSeconds})
        .from(tracks)
        .where(eq(tracks.id, trackId))
        .limit(1);

    if(!track) throw new Error("Track not found");

    const played = Number(playedDurationSeconds);
    const duration = Number(track.durationSeconds);

    if (!Number.isFinite(played) || played < 0) {
        throw new Error("Invalid played duration");
    }

    if (played > duration) {
        throw new Error("Played duration cannot exceed track duration");
    }

    const completionRatio = (Number(playedDurationSeconds)/Number(track.durationSeconds));
    const finalRatio = Math.min(completionRatio, 1); 

    await db
        .insert(listeningEvents)
        .values({
            userId,
            trackId,
            playedDurationSeconds,
            completionRatio: finalRatio.toString(),
            completed: finalRatio >= 0.90,
        })
}

export async function getListeningEvents(
    userId: string,
    page: number,
    limit: number
){
    const offset = ( page - 1 ) * limit;
    const [totalEvents] = await db
        .select({
            total: count()
        })
        .from(listeningEvents)
        .where(eq(listeningEvents.userId, userId));

    const result = await db
        .select({
            trackId: listeningEvents.trackId,
            track: tracks.title,
            playedDurationSeconds: listeningEvents.playedDurationSeconds,
            completionRatio: listeningEvents.completionRatio,
            completed: listeningEvents.completed,
            playedAt: listeningEvents.playedAt
        })
        .from(listeningEvents)
        .leftJoin(
            tracks,
            eq(tracks.id, listeningEvents.trackId)
        )
        .where(eq(listeningEvents.userId, userId))
        .orderBy(desc(listeningEvents.playedAt), desc(listeningEvents.id))
        .limit(limit)
        .offset(offset);

    return {
        result,
        total: totalEvents?.total ?? 0
    }
}

export async function setFavoriteTrack(userId: string, trackId: string){
    await db
        .insert(favorites)
        .values({
            userId,
            trackId
        })
        .onConflictDoNothing()
}

export async function deleteFavoriteTrack(userId: string, trackId: string) {
    await db
        .delete(favorites)
        .where(
            and(
                eq(favorites.trackId, trackId),
                eq(favorites.userId, userId)
            )
        )
}

export async function setFavoriteAlbum(userId: string, albumId: string){
    await db
        .insert(favorites)
        .values({
            userId,
            albumId
        })
        .onConflictDoNothing()
}

export async function deleteFavoriteAlbum(userId: string, albumId: string) {
    await db
        .delete(favorites)
        .where(
            and(
                eq(favorites.albumId, albumId),
                eq(favorites.userId, userId)
            )
        )
}

export async function setFavoriteArtist(userId: string, artistId: string){
    await db
        .insert(favorites)
        .values({
            userId,
            artistId
        })
        .onConflictDoNothing()
}

export async function deleteFavoriteArtist(userId: string, artistId: string) {
    await db
        .delete(favorites)
        .where(
            and(
                eq(favorites.artistId, artistId),
                eq(favorites.userId, userId)
            )
        )
}

export async function getFavoriteTracks(userId: string) {
    return await db
        .select({
            id: favorites.id,
            userId: favorites.userId,
            trackId: favorites.trackId,
            createAt: favorites.createdAt
        })
        .from(favorites)
        .where(
            and(
                isNotNull(favorites.trackId),
                eq(favorites.userId, userId)
            )
        )
        .orderBy(desc(favorites.createdAt))
}

export async function getFavoriteAlbums(userId: string) {
    return await db
        .select({
            id: favorites.id,
            userId: favorites.userId,
            album: favorites.albumId,
            createAt: favorites.createdAt
        })
        .from(favorites)
        .where(
            and(
                isNotNull(favorites.albumId),
                eq(favorites.userId, userId)
            )
        )
        .orderBy(desc(favorites.createdAt))
}

export async function getFavoriteArtists(userId: string) {
    return await db
        .select({
            id: favorites.id,
            userId: favorites.userId,
            aristId: favorites.artistId,
            createAt: favorites.createdAt
        })
        .from(favorites)
        .where(
            and(
                isNotNull(favorites.artistId),
                eq(favorites.userId, userId)
            )
        )
        .orderBy(desc(favorites.createdAt))
}

export async function createPlaylist(
    userId: string,
    name: string,
    description: string | null,
    coverImagePath: string | null,
) {
    await db
        .insert(playlists)
        .values({
            userId,
            name,
            description,
            coverImagePath,
        })
        .onConflictDoNothing()
}

export async function getPlaylists(
    userId: string
) {
    return await db
        .select({
            name: playlists.name,
            description: playlists.description,
            isPublic: playlists.isPublic
        })
        .from(playlists)
        .where(eq(playlists.userId, userId))
}

export async function updatePlaylist(
    playlistId: string,
    name?: string,
    description?: string,
    isPublic?: boolean,
) {
    await db
        .update(playlists)
        .set({
            name,
            description,
            isPublic
        })
        .where(eq(playlists.id, playlistId))
}