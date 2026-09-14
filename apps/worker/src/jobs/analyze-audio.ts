import { db, tracks } from "@melodive/db";
import { analyzeAudioLoudness } from "../library/audio-analysis.js";
import { eq } from "drizzle-orm";

interface analyzeAudioLoudness{
    trackId: string;
    sourceFilePath: string;
}

export async function processAnalyzeAudioJob(
    payload: unknown
) {
    const {trackId, sourceFilePath} = payload as analyzeAudioLoudness;
    console.log(`[ANALYZE_AUDIO]: Analyzing loudness for track ${trackId}`);
    const analysis = await analyzeAudioLoudness(sourceFilePath);

    await db
      .update(tracks)
      .set({
        loudnessLufs: analysis.loudnessLufs.toString(),
        gainDb: analysis.gainDb.toString()
      })
      .where(eq(tracks.id, trackId));

    console.log(`[ANALYZE_AUDIO]: Finished track ${trackId}, Gain: ${analysis.gainDb}`);
    return analysis;
}