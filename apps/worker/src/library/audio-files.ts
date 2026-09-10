import { extname } from "node:path";

const AUDIO_EXTENSIONS = new Set([
    ".mp3",
    ".flac",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".opus",
]);

export function isAudioFile(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase();
    return AUDIO_EXTENSIONS.has(extension);
}