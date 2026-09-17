import {eq, and} from "drizzle-orm"
import { db } from "@melodive/db"
import { 
    artists,
    albums,
    tracks,
    trackArtists,
 } from "@melodive/db";
 import { stat } from "node:fs/promises"

import type { AudioMetadata } from "./metadata.js";
import { logger } from "../config/logger.js";

interface ImportTrackInput {
    filePath: string;
    librarySourceId: string;
    metadata: AudioMetadata;
    checksum: string;
}

export async function importTrack({
    filePath,
    librarySourceId,
    metadata,
    checksum
}: ImportTrackInput) {

    try {
      return await db.transaction(async (tx) => {
        
          const fileStats = await stat(filePath);
          const fileSizeBytes = fileStats.size;

          if(!metadata.artist) throw new Error(`Missing artist metadata: ${filePath}`);
          if(!metadata.album) throw new Error(`Missing album metadata: ${filePath}`);
          if(!metadata.title) throw new Error(`Missing title metadata: ${filePath}`);

          //1. find or create artist
          let [artist] = await tx
            .select()
            .from(artists)
            .where(
              eq(
                  artists.name,
                  metadata.albumArtist ?? metadata.artist
                )
              )
            .limit(1);

          let artistCreated = false;

          if(!artist) {
              [artist] = await tx
                .insert(artists)
                .values({
                  name: metadata.albumArtist ?? metadata.artist
                })
                .returning();
                
                artistCreated = true;
          }

          if(!artist) {
            throw new Error("Artist could not be resolved");
          };

          if(artistCreated) {
            await logger.info("ARTIST_CREATED", {
              details: {
                artistId: artist.id,
                artistName: artist.name,
                path: filePath
              }
            })
          }

          //2. find or create album
          let [album] = await tx
            .select()
            .from(albums)
            .where(
              and(
                  eq(albums.title, metadata.album),
                  eq(albums.artistId, artist.id),
                ),
              )
            .limit(1);    

          let albumCreated = false;

          if(!album) {
              [album] = await tx
                .insert(albums)
                .values({
                  title: metadata.album,
                  artistId: artist.id,
                  releaseYear: metadata.year,
                  genres: metadata.genre ? [metadata.genre] : []
                })
                .returning();

                albumCreated = true
          }
          if(!album) throw new Error("Album could not be resolved");

          if(albumCreated) {
            await logger.info("ALBUM_CREATED", {
              details: {
                albumId: album.id,
                albumTitle: album.title,
                artistId: artist.id,
                path: filePath
              }
            })
          }

          //3. find or create track
          let [track] = await tx
            .select()
            .from(tracks)
            .where(eq(tracks.filePath, filePath))
            .limit(1);

          let trackCreated = false;

          if(track) {
              [track]= await tx
                .update(tracks)
                .set({
                  title: metadata.title,
                  albumId: album.id,
                  trackNumber: metadata.trackNumber,
                  discNumber: metadata.discNumber,
                  durationSeconds: String(metadata.durationSeconds),
                  format: metadata.format,
                  bitrate: metadata.bitrate,
                  sampleRate: metadata.sampleRate,
                  checkSumSha256: checksum,
                  channels: metadata.channels,
                  bitDepth: metadata.bitDepth,
                  fileSizeBytes,
                  librarySourceId,
                  updatedAt: new Date(),
                })
                .where(eq(tracks.id, track.id))
                .returning();
              
              } else {
                  [track] = await tx
                    .insert(tracks)
                    .values({
                      title: metadata.title,
                      albumId: album.id,
                      trackNumber: metadata.trackNumber,
                      discNumber: metadata.discNumber,
                      durationSeconds: String(metadata.durationSeconds),
                      filePath,
                      librarySourceId,
                      checkSumSha256: checksum,
                      format: metadata.format,
                      bitrate: metadata.bitrate,
                      sampleRate: metadata.sampleRate,
                      channels: metadata.channels,
                      bitDepth: metadata.bitDepth,
                      fileSizeBytes
                    })
                    .returning();

                    trackCreated = true;
              }
          if(!track) throw new Error("Track could not be resolved");

          await logger.info(
            trackCreated ? "TRACK_CREATED" : "TRACK_UPDATED", 
              {
                details: {
                  trackId: track.id,
                  albumId: album.id,
                  artistId: artist.id,
                  path: filePath
                }
              }
          )

          //4. connect track => artist
          let [existingCredit] = await tx
            .select()
            .from(trackArtists)
            .where(
              and(
                  eq(trackArtists.trackId, track.id),
                  eq(trackArtists.artistId, artist.id),
              ),
            )
            .limit(1);

            if(!existingCredit) {
              await tx.insert(trackArtists).values({
                  trackId: track.id,
                  artistId: artist.id,
                  role: "primary"
              });
            }

            return {
              artist,
              album,
              track,
            };
      });
    } catch (error) {
      await logger.error("TRACK_IMPORT_FAILED", {
        details: {
          path: filePath,
          librarySourceId
        },
        error
      });
      throw error;
    }
}