import { db, favorites, listeningEvents, tracks, userPlaybackStates } from "@melodive/db";
import { eq, count, desc, and } from "drizzle-orm";

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