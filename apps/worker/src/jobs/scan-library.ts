import { db, librarySources } from "@melodive/db";
import { eq } from "drizzle-orm";
import { scanDirectory } from "../library/scanner.js";
import { extractMetadata } from "../library/metadata.js";
import { importTrack } from "../library/importer.js";
import { enqueueJob } from "./producer.js";
import { calculateFileHash } from "../library/checksum.js";
import { tracks, albums } from "@melodive/db";
import { access } from "node:fs/promises";
import type { PathLike } from "node:fs";

export async function processScanLibraryJob(targetPath: string, name="MusicLib") {
    console.log(`[SCAN_LIBRARY]: Starting scan for: ${targetPath}`);

    let [sourceRecord] = await db
      .select()
      .from(librarySources)
      .where(eq(librarySources.path, targetPath))
      .limit(1);

    if(!sourceRecord) {
        console.log(`[SCAN_LIBRARY]: New Folder detected. Registering in Library Sources...`);
        [sourceRecord] = await db
          .insert(librarySources)
          .values({
            name: `${name}`,
            path: targetPath,
          })
          .returning();
    }
    if(!sourceRecord) throw new Error("Library source could not be resolved.")
    //need to fetch library source id which is required for the importTrack utility
    const librarySourceId = sourceRecord.id;
    console.log(`[SCAN_LIBRARY]: Using librarySourceId: ${librarySourceId}`);

    const audioFiles = await scanDirectory(targetPath);
    console.log(`[SCAN_LIBRARY]: Found ${audioFiles.length} files. Extracting and importing...`);

    let successCount = 0;
    const enqueuedAlbums = new Set<string>();

    const existingRecords = await db
      .select({
        id: tracks.id,
        path: tracks.filePath,
        hash:tracks.checkSumSha256,
        albumId: tracks.albumId,
        artworkPath: albums.artworkPath,
        waveformPath: tracks.waveformPath
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .where(eq(tracks.librarySourceId, librarySourceId));

    const trackCache = new Map(existingRecords.map((track) => [track.path, track]));

    for(const filePath of audioFiles) {
        try {
            const fileHash = await calculateFileHash(filePath);
            const cached = trackCache.get(filePath);

            if(cached?.hash === fileHash) {
                console.log(`[SCAN_LIBRARY]: Unchanged, skipping ${filePath}`);

                if(cached.albumId && !cached.artworkPath && !enqueuedAlbums.has(cached.albumId)) {
                    await enqueueJob("FETCH_ARTWORK", { 
                    albumId: cached.albumId, 
                    sourceFilePath: filePath 
                    });
                    enqueuedAlbums.add(cached.albumId);
                    console.log(`[SCAN_LIBRARY]: Queued FETCH_ARTWORK for skipped album`);
                }

                let waveformExists = false;

                if (cached.waveformPath) {
                    try {
                        await access(cached.waveformPath);
                        waveformExists = true;
                    } catch {
                        waveformExists = false;
                    }
                }

                if (!waveformExists) {
                    console.log(
                        `[SCAN_LIBRARY]: Waveform missing for track ${cached.id}`
                    );

                    await enqueueJob("GENERATE_WAVEFORM", {
                        trackId: cached.id,
                        sourceFilePath: filePath
                    });

                    console.log(
                        `[SCAN_LIBRARY]: Queued GENERATE_WAVEFORM for ${filePath}`
                    );
                }
                continue;
            }
            
            const metadata = await extractMetadata(filePath);
            if(metadata) {
                const {album, track} = await importTrack({
                    filePath,
                    librarySourceId,
                    metadata,
                    checksum: fileHash
                });
                successCount++;

                await enqueueJob("GENERATE_WAVEFORM", {
                    trackId: track.id,
                    sourceFilePath: filePath
                })

                if(metadata.hasArtwork && !album.artworkPath && !enqueuedAlbums.has(album.id)) {
                    await enqueueJob(
                        "FETCH_ARTWORK", {
                            albumId: album.id,
                            sourceFilePath: filePath
                    });
                    enqueuedAlbums.add(album.id);
                    console.log(`[SCAN_LIBRARY]: Queued FETCH_ARTWORK for album ${album.title}`)
                }
            }
        } catch (error) {
            console.log(`[SCAN_LIBRARY]: Failed to process ${filePath}:`, error);
        }
    }
    console.log(`[SCAN_LIBRARY]: Finished. Successfully imported ${successCount} tracks.`);
    return {
        scannedPath: targetPath,
        filesFound: audioFiles.length,
        filesImported: successCount,
        librarySourceId
    };

}
