import {execFile} from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile)

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
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
    ]);

    const data = JSON.parse(stdout) as FFProbeOutput;

    const format = data.format;
    const audioStream = data.streams?.find(
        (stream) => stream.codec_type === "audio"
    );

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