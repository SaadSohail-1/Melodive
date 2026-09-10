import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { isAudioFile } from "./audio-files.js";

export async function scanDirectory(
    directory: string // root dir e.g., /music
) : Promise<string[]> {
    
    const audioFiles: string[] = [];

    async function walk(currentDirectory: string) { //recursive function for DFS of audio files
        const entries = await readdir(currentDirectory, {
            withFileTypes: true
        });

        for(const entry of entries){
            const fullPath = join(currentDirectory, entry.name);

            if(entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }
            if(entry.isFile() && isAudioFile(fullPath)) {
                audioFiles.push(fullPath);
            }
        }
    }

    await walk(directory);
    return audioFiles;
}