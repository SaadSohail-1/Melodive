import { db, listeningEvents, tracks, userPlaybackStates } from "@melodive/db";
import { eq, count, desc } from "drizzle-orm";

export async function getPlaybackState(id: string) {
    const [result] = await db
        .select({
            trackId: userPlaybackStates.activeTrackId,
            positionSeconds: userPlaybackStates.positionSeconds,
            isPlaying: userPlaybackStates.isPlaying,
        })
        .from(userPlaybackStates)
        .where(eq(userPlaybackStates.userId, id))
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