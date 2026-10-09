import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path, { dirname, join } from "node:path";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { albums, db } from "@melodive/db";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(__dirname, "../../../.env")
});

const ARTWORK_DIR = process.env.ARTWORK_STORAGE_PATH;

interface FetchArtworkPayload {
    albumId: string;
    sourceFilePath: string;
}

export async function processFetchArtworkJob(payload: unknown) {
    if (!ARTWORK_DIR) {
    throw new Error("ARTWORK_STORAGE_PATH is required");
    }
    const {albumId, sourceFilePath} = payload as FetchArtworkPayload;
    console.log(`[FETCH_ARTWORK]: Extracting art for album ${albumId}`);

    await mkdir(ARTWORK_DIR, {recursive: true});
    const fileName = `${albumId}.jpg`;
    const outputPath = join(ARTWORK_DIR, fileName); //like storage/artwork/81283120139.jpg

    const trackDirectory = dirname(sourceFilePath);
    const commonArtworkNames = ["cover.jpg", "folder.jpg", "front.jpg", "cover.png"];
    
    let artworkFound = false;

    for(const name of commonArtworkNames) {
        try {
            const localPath = join(trackDirectory, name);
            const fileInfo = await stat(localPath);

            if(fileInfo.isFile()) {
                console.log(`[FETCH_ARTWORK]: Found local folder art: ${name}`);
                await copyFile(localPath, outputPath);
                artworkFound= true;
                break;
            }
        } catch (error) {

        }
    }
    if(!artworkFound) {
        console.log(`[FETCH_ARTWORK]: Extracting embedded binary from audio file...`);
        try {
            await execFileAsync("ffmpeg", [
            "-y", //"yes", automatically overwrites the outputPath file if it already exists without prompting
            "-i", sourceFilePath, //The input audio file which is at sourceFilePath
            "-an",  //"Audio Null",strips out the audio data entirely since we only care about the image
            "-vcodec", "mjpeg", //video-codec: forces the output stream to be a JPEG img
            "-frames:v", "1", //tells ffmpeg to only extract ONE frame (which is the cover art)
            outputPath //saves the extracted artwork to the outputPath
        ]);
        artworkFound = true;

        } catch (error) {
            console.error(`[FETCH_ARTWORK]: No embedded art found in ${sourceFilePath}`, error);   
        }
    }

    if(artworkFound) {
        await db
        .update(albums)
        .set({
            artworkPath: outputPath,
            updatedAt: new Date()
        })
        .where(eq(albums.id, albumId));

        console.log(`[FETCH_ARTWORK]: Successfully saved to ${outputPath}`)
    }

    return {
        artworkPath: outputPath
    };
}