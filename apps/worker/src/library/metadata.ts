import {execFile} from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
/*
we do not use exec here because its not necessary to spawn a shell
we just need the metadata which execFile saves in a buffer and gives us the final output(stdout)
ffprobe runs almost instantly and outputs a small block of text, buffering it is a good approach instead of using spawn to stream it
*/
export interface AudioMetadata{
    title: string | null;
    artist: string | null;
    album: string | null;
    albumArtist: string | null;
    trackNumber: number | null;
    discNumber: number | null;
    year: number | null;

    durationSeconds: number | null;
    format: string;

    bitrate: number | null;
    sampleRate: number | null;
    channels: number | null;
    bitDepth: number | null;

    hasArtwork: boolean;
}

interface FFProbeOutput {
    format?: {
        format_name?: string;
        duration?: string;
        bit_rate?: string;
        tags?: Record<string, string>;
    };

    streams?: Array<{
        codec_type?: string;
        sample_rate?: string;
        channels?: number;
        bits_per_sample?: number;
        bits_per_raw_sample?: string;
    }>;
}

export async function extractMetadata(
    filePath: string,
) : Promise<AudioMetadata> {

    const { stdout } = await execFileAsync("ffprobe", [
        "-v", "quiet", //v:verbosity, basically we're shutting up ffprobe for a cleaner output
        "-print_format", "json", //this is crucial, it tells ffprobe to spit the data out in json string
        "-show_format", //gets container level info (e.g., duration, file size, ID3 tags like artist, title)
        "-show_streams", //gets track-level info(e.g., is it mono or stereo or what codec is it using)
        filePath, //location of the file we're analyzing
    ]);

    const data = JSON.parse(stdout) as FFProbeOutput;

    const format = data.format;
    const audioStream = data.streams?.find(
        (stream) => stream.codec_type === "audio"
    );

    const videoStream = data.streams?.find(
        (stream) => stream.codec_type==="video"
    )
    const tags = normalizeTags(format?.tags ?? {});
    
    return {
        title: tags.title ?? null,
        artist: tags.artist ?? null,
        album: tags.album ?? null,
        albumArtist: tags.albumartist ?? null,

        trackNumber: parseNumber(tags.track),
        discNumber: parseNumber(tags.disc),

        year:
          parseNumber(tags.date) ?? 
          parseNumber(tags.year),

        durationSeconds:
          Number(format?.duration ?? 0),

        format:
          format?.format_name?.split(",")[0] ?? "unknown",

        bitrate:
          parseNumber(format?.bit_rate),

        sampleRate: 
          parseNumber(audioStream?.sample_rate),

        channels:
          audioStream?.channels ?? null,

        bitDepth:
          parseNumber(audioStream?.bits_per_raw_sample) ??
          audioStream?.bits_per_sample ??
          null,

        hasArtwork: !!videoStream,
    };
}

function parseNumber(
    value: string | number | undefined,
): number | null {
    
    if(value===undefined) return null;

    const match = String(value).match(/^\d+/);

    if(!match) return null;

    return Number(match[0]);
}

function normalizeTags (
    tags: Record<string, string>
) : Record<string, string> {

    const normalized: Record<string, string> = {};
    if(!tags) return normalized;

    for(const [key, value] of Object.entries(tags)) {
        normalized[key.toLowerCase().replace(/[\s_-]/g, "")] = value;
    }
    return normalized;
}