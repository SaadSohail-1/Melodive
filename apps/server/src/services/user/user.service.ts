import { db, userPlaybackStates } from "@melodive/db";
import { eq } from "drizzle-orm";

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