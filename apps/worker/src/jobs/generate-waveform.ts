import { db, tracks } from "@melodive/db";
import { eq } from "drizzle-orm";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";


const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WAVEFORM_DIR = path.resolve(
    __dirname,
    "../../../../storage/waveforms"
);

const SAMPLE_COUNT = 1000;

interface GenerateWaveformPayload {
    trackId: string;
    sourceFilePath: string;
}

export async function processGenerateWaveformJob(
    payload: unknown
) {
    const {trackId, sourceFilePath} = payload as GenerateWaveformPayload;
    console.log(`[GENERATE_WAVEFORM]: Generating waveform for track ${trackId}`);

    await mkdir(WAVEFORM_DIR, {
        recursive: true,
    });

    /* FFmpeg converts the audio into
        -mono
        -16-bit signed PCM (Pulse-code modulation)
        -8khz
        we dont need the original audio qualit here, this is only to measure the amplitude 
    */
   const { stdout } = await execFileAsync(
    "ffmpeg", [
        "-i", sourceFilePath, //input from sourceFilePath
        "-ac", "1", //converts stereo sounds (left and right) to mono channel
        "-ar", "8000", //8khz (funfact: 8khz is telephone quality)
        "-f", "s16le", //converts to signed 16-bit little-endian and outputs raw audio data poiints
        "-" //output to stdout
    ],
    {
        encoding: "buffer",
        maxBuffer: 1024*1024*200,
    }
   )

   const pcm = stdout as unknown as Buffer; //first we did as unknown to strip away all existing type assumptions
   
   const totalSamples = Math.floor(pcm.length/2);

   if(totalSamples===0) throw new Error("FFmpeg produced no audio samples");

   const samplesPerBucket = Math.max(1, Math.floor(totalSamples/SAMPLE_COUNT));

   const waveform: number[] = [];

   for(
    let bucket = 0;
    bucket < SAMPLE_COUNT;
    bucket++
   ) {
    const startSample = bucket * samplesPerBucket;
    if(startSample >= totalSamples){
        break;
    }
    const endSample = Math.min(startSample + samplesPerBucket, totalSamples);

    let peak = 0;
    for (
        let sample = startSample;
        sample < endSample;
        sample++
    ) {
        const offset = sample * 2;
        const value = pcm.readInt16LE(offset);
        const amplitude = Math.abs(value) / 32768;
        if(amplitude > peak){
            peak = amplitude;
        }
    }
    waveform.push(
        Number(peak.toFixed(4))
    );
   }

   const outputPath = path.join(
    WAVEFORM_DIR,
    `${trackId}.json`
   );

   await writeFile(
    outputPath,
    JSON.stringify(waveform),
    "utf8"
   );

   await db
    .update(tracks)
    .set({
        waveformPath: outputPath,
        updatedAt: new Date(),
    })
    .where(eq(tracks.id, trackId));

    console.log(`[GENERATE_WAVEFORM]: Saved ${waveform.length} points to ${outputPath}`);

    return {
        trackId,
        waveformPath: outputPath,
        sampleCount: waveform.length,
    };
}