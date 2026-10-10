import { db, librarySources } from "@melodive/db";
import { eq, inArray } from "drizzle-orm";
import { scanDirectory } from "../library/scanner.js";
import { extractMetadata } from "../library/metadata.js";
import { importTrack } from "../library/importer.js";
import { enqueueJob } from "./producer.js";
import { calculateFileHash } from "../library/checksum.js";
import { tracks, albums } from "@melodive/db";
import { access, stat } from "node:fs/promises";
import { logger } from "../config/logger.js";
import { updateJobProgress } from "./job.worker.js";

export async function processScanLibraryJob(targetPath: string, name="MusicLib", jobId?: number) {
    console.log(`[SCAN_LIBRARY]: Starting scan for: ${targetPath}`);
    await logger.info("SCAN_LIBRARY_STARTED", {
        details: {
            path: targetPath
        }
    })

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

    if(jobId !== undefined) {
        await updateJobProgress(jobId, {
            stage: "SCANNING_DIRECTORY",
            filesFound: null,
            filesProcessed: 0,
            filesImported: 0,
            filesFailed: 0,
            followUpJobsQueued: 0
        });
    }

    const audioFiles = await scanDirectory(targetPath);
    console.log(`[SCAN_LIBRARY]: Found ${audioFiles.length} files. Extracting and importing...`);
    let successCount = 0;

    let filesProcessed = 0;
    let filesFailed = 0;
    let followUpJobsQueued = 0;
    let filesSinceLastUpdate = 0;

    const saveProgress = async(stage: string) => {
        if(jobId === undefined) return;
        await updateJobProgress(jobId, {
            stage,
            filesFound: audioFiles.length,
            filesProcessed,
            filesImported:  successCount,
            filesFailed,
            followUpJobsQueued, 
        });
    }

    const queueFollowUpJob = async (
        type: string,
        payload: unknown
    ) => {
        await enqueueJob(type, payload);
        followUpJobsQueued++;
    }
    await saveProgress("PROCESSING_FILES");

    const enqueuedAlbums = new Set<string>();  
    /*^if the scanner goes to album1/track1.flac, and it detects that its missing the album cover, and it moves to album1/track2.flac
    it will again say that the cover is missing, so we check the album cover in metadata only once (on the first track),
    and then add the albumId to the Set so that on track2 it checks that the set already has the albumId enqueued for fetch_artwork job
    */
    const existingRecords = await db //for in-memory cache
      .select({
        id: tracks.id,
        path: tracks.filePath,
        hash:tracks.checkSumSha256,
        albumId: tracks.albumId,
        artworkPath: albums.artworkPath,
        fileSizeBytes: tracks.fileSizeBytes,
        waveformPath: tracks.waveformPath,
        loudnessLufs: tracks.loudnessLufs,
        gainDb: tracks.gainDb
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id)) //gets every single row from the left table (tracks), then looks at the right table (albums). whereever the tracks.albumId and albums.id matches, glue those rows of albums to the tracks table."
      .where(eq(tracks.librarySourceId, librarySourceId));

    const trackCache = new Map(existingRecords.map((track) => [track.path, track])); //stores as {trackPath(string): track(full object)}

    for(const filePath of audioFiles) {
        try {
            const fileHash = await calculateFileHash(filePath); //for detla scan
            const cached = trackCache.get(filePath); //in-memory cache

            if(cached?.hash === fileHash) {
                console.log(`[SCAN_LIBRARY]: Unchanged, skipping ${filePath}`);
                
                if(cached.albumId && !cached.artworkPath && !enqueuedAlbums.has(cached.albumId)) {
                    await queueFollowUpJob("FETCH_ARTWORK", { 
                    albumId: cached.albumId, 
                    sourceFilePath: filePath 
                    });
                    enqueuedAlbums.add(cached.albumId);
                    console.log(`[SCAN_LIBRARY]: Queued FETCH_ARTWORK for skipped album`);
                    await logger.info("QUEUED_FETCH_ARTWORK", {
                        details: {
                            path: filePath,
                            trackState: "existing"
                        }
                    })
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

                    await queueFollowUpJob("GENERATE_WAVEFORM", {
                        trackId: cached.id,
                        sourceFilePath: filePath
                    });

                    await logger.info("QUEUED_GENERATE_WAVEFORM", {
                        details: {
                            path: filePath,
                            trackState: "existing"
                        }
                    })

                    console.log(
                        `[SCAN_LIBRARY]: Queued GENERATE_WAVEFORM for ${filePath}`
                    );
                }

                if(!cached.loudnessLufs || !cached.gainDb) {
                    await queueFollowUpJob("ANALYZE_AUDIO", {
                        trackId: cached.id,
                        sourceFilePath: filePath
                    })
                    await logger.info("QUEUED_ANALYZE_AUDIO", {
                        details: {
                            path: filePath,
                            trackState: "existing"
                        }
                    })
                }
                
                if(cached.fileSizeBytes === null) {
                    const fileStats = await stat(filePath);
                    await db
                      .update(tracks)
                      .set({
                        fileSizeBytes: fileStats.size,
                        updatedAt: new Date(),
                      })
                      .where(eq(tracks.id, cached.id));

                    console.log(`[SCAN_LIBRARY]: Updated file size for ${filePath}`)
                }

                continue;
            }
            
            const metadata = await extractMetadata(filePath);
            
            if(metadata) {

                await logger.info("EXTRACTED_METADATA", {
                    details: {
                        path: filePath
                    }
                })

                const {album, track} = await importTrack({
                    filePath,
                    librarySourceId,
                    metadata,
                    checksum: fileHash
                });
                successCount++;

                await queueFollowUpJob("GENERATE_WAVEFORM", {
                    trackId: track.id,
                    sourceFilePath: filePath
                });

                await logger.info("QUEUED_GENERATE_WAVEFORM", {
                    details: {
                        path: filePath,
                        trackState: "new"
                    }
                })

                await queueFollowUpJob("ANALYZE_AUDIO", {
                    trackId: track.id,
                    sourceFilePath: filePath
                })

                await logger.info("QUEUED_ANALYZE_AUDIO", {
                    details: {
                        path: filePath,
                        trackState: "new"
                    }
                })

                if(metadata.hasArtwork && !album.artworkPath && !enqueuedAlbums.has(album.id)) {
                    await queueFollowUpJob(
                        "FETCH_ARTWORK", {
                            albumId: album.id,
                            sourceFilePath: filePath
                    });
                    enqueuedAlbums.add(album.id);
                    console.log(`[SCAN_LIBRARY]: Queued FETCH_ARTWORK for album ${album.title}`)
                    await logger.info("QUEUED_FETCH_ARTWORK", {
                        details: {
                            path: filePath,
                            trackState: "new"
                        }
                    })
                }
            }
        } catch (error) {
            filesFailed++;
            console.log(`[SCAN_LIBRARY]: Failed to process ${filePath}:`, error);
            await logger.error("SCAN_LIBRARY_FAILED", {
                details: {
                    path: filePath
                },
                error
            })
        } finally {
            filesProcessed++;
            filesSinceLastUpdate++;

            if(
                filesSinceLastUpdate >= 25 || 
                filesProcessed === audioFiles.length
            ) {
                await saveProgress("PROCESSING_FILES");
                filesSinceLastUpdate = 0;
            }
        }
    }
    // orphan cleanup logic, removing the records of the files from db that no longer exist in drive.
    //the below logic will only delete entries from the tracks table and other tables are left with ghost references.
    await saveProgress("CLEANING_UP");
    const diskFilesSet = new Set(audioFiles);
    const orphansToRemove: string[] = [];

    for(const cachedPath of trackCache.keys()){
        if(!diskFilesSet.has(cachedPath)){
            orphansToRemove.push(cachedPath);
        }
    }
    if(orphansToRemove.length>0) {
        console.log(`[SCAN_LIBRARY]: found ${orphansToRemove.length} orphaned files. Removing from database...`);
        await logger.info("ORPHANS_FOUND", {
            details: {
                orphanCount: orphansToRemove.length,
            }
        })
        try {
            await db
              .delete(tracks)
              .where(inArray(tracks.filePath, orphansToRemove));
            
            console.log(`[SCAN_LIBRARY]: Successfully removed ${orphansToRemove.length} orphaned tracks.`);
        } catch (error) {
            console.error(`[SCAN_LIBRARY]: Failed to delete orphans:`, error);
            await logger.error("ORPHAN_CLEANUP_FAILED", {
                details: {
                    orphansCount: orphansToRemove.length
                },
                error
            })
        }
    }

    console.log(`[SCAN_LIBRARY]: Finished. Successfully imported ${successCount} tracks.`);
    await logger.info("SCAN_LIBRARY_FINISHED", {
        details: {
            path: targetPath,
            filesFound: audioFiles.length,
            filesImported: successCount,
            orphansRemoved: orphansToRemove.length
        }
    });
    return {
        scannedPath: targetPath,
        filesFound: audioFiles.length,
        filesImported: successCount,
        orphansRemoved: orphansToRemove.length,
        librarySourceId
    };

}
