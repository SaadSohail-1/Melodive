import { albums, artists, db, trackArtists, tracks } from "@melodive/db";
import { count, countDistinct, eq, ilike } from "drizzle-orm";

export async function getArtists(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [totalResult] = await db
        .select({
            total: count(),
        })
        .from(artists);
        
    const result = await db
        .select({
            id: artists.id,
            name: artists.name,
            imagePath: artists.imagePath,
            albumCount: countDistinct(albums.id),
            trackCount: countDistinct(trackArtists.trackId)
        })
        .from(artists)
        .leftJoin(
            albums, 
            eq(albums.artistId, artists.id)
        )
        .leftJoin(
            trackArtists, 
            eq(trackArtists.artistId, artists.id)
        )
        .groupBy(
            artists.id,
            artists.name,
            artists.imagePath
        )
        .orderBy(artists.name)
        .limit(limit)
        .offset(offset)

    return {
        artists: result,
        total: totalResult?.total ?? 0,
    };
}

export async function getArtist(id: string) {
    const [result] = await db
        .select({
            id: artists.id,
            name: artists.name,
            biography: artists.biography,
            imagePath: artists.imagePath,
            albumCount: countDistinct(albums.id),
            trackCount: countDistinct(trackArtists.trackId)
        })
        .from(artists)
        .leftJoin(
            albums,
            eq(albums.artistId, artists.id)
        )
        .leftJoin(
            trackArtists,
            eq(trackArtists.artistId, artists.id)
        )
        .where(eq(artists.id, id))
        .groupBy(
            artists.id,
            artists.name,
            artists.biography,
            artists.imagePath
        );

        return result ?? null;
}

export async function getAlbums(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [totalResult] = await db
        .select({
            total: count(),
        })
        .from(albums);

    const result = await db
        .select({
            id: albums.id,
            title: albums.title,
            artists: {
                id: artists.id,
                name: artists.name
            },
            releaseYear: albums.releaseYear,
            artworkPath: albums.artworkPath,
            totalTracks: albums.totalTracks
        })
        .from(albums)
        .leftJoin(
            artists,
            eq(albums.artistId, artists.id)
        )
        .orderBy(albums.title)
        .limit(limit)
        .offset(offset)

        return {
            albums: result,
            total: totalResult?.total ?? 0,
        };
}

export async function getAlbum(id: string) {
    const [result] = await db
        .select({
            id: albums.id,
            title: albums.title,
            artist: {
                id: artists.id,
                name: artists.name
            },
            releaseYear: albums.releaseYear,
            artworkPath: albums.artworkPath,
            genres: albums.genres,
            totalTracks: albums.totalTracks,
            totalDiscs: albums.totalDiscs
        })
        .from(albums)
        .innerJoin(
            artists,
            eq(albums.artistId, artists.id)
        )
        .where(eq(albums.id, id))

        return result ?? null;
}

export async function getArtistAlbums(artistId: string) {
    const result = await db
      .select({
        id: albums.id,
        title: albums.title,
        releaseYear: albums.releaseYear,
        artworkPath: albums.artworkPath,
        totalTracks: albums.totalTracks,
        totalDiscs: albums.totalDiscs
      })
      .from(albums)
      .where(eq(albums.artistId, artistId))
      .orderBy(albums.releaseYear, albums.title)

    return result;
}

export async function getAlbumTracks(albumId: string) {
    const result = await db
        .select({
            id: tracks.id,
            title: tracks.title,
            trackNumber: tracks.trackNumber,
            discNumber: tracks.discNumber,
            durationSeconds: tracks.durationSeconds,
            format: tracks.format
        })
        .from(tracks)
        .where(eq(tracks.albumId, albumId))
        .orderBy(tracks.discNumber, tracks.trackNumber)

    return result;
}

export async function getTracks(page: number, limit: number){
    const offset = ( page - 1 ) * limit;

    const [totalResult] = await db
        .select({
            total: count()
        })
        .from(tracks);

    const result = await db
        .select({
            id: tracks.id,
            title: tracks.title,
            album: albums.title,
            artist: artists.name,
            trackNumber: tracks.trackNumber,
            discNumber: tracks.discNumber,
            durationSeconds: tracks.durationSeconds,
            format: tracks.format,
            bitrate: tracks.bitrate,
            sampleRate: tracks.sampleRate,
            channels: tracks.channels,
            fileSizeBytes: tracks.fileSizeBytes,
            waveFormPath: tracks.waveformPath
        })
        .from(tracks)
        .innerJoin(
            albums,
            eq(tracks.albumId, albums.id)
        )
        .innerJoin(
            artists,
            eq(albums.artistId, artists.id)
        )
        .orderBy(albums.title, artists.name, tracks.title)
        .limit(limit)
        .offset(offset)

    return {
        tracks: result,
        total: totalResult?.total ?? 0
    };
}

export async function getTrack(id: string){
     const [result] = await db
        .select({
            id: tracks.id,
            title: tracks.title,
            album: albums.title,
            artist: artists.name,
            trackNumber: tracks.trackNumber,
            discNumber: tracks.discNumber,
            durationSeconds: tracks.durationSeconds,
            format: tracks.format,
            bitrate: tracks.bitrate,
            sampleRate: tracks.sampleRate,
            channels: tracks.channels,
            fileSizeBytes: tracks.fileSizeBytes,
            waveFormPath: tracks.waveformPath
        })
        .from(tracks)
        .where(eq(tracks.id, id))
        .innerJoin(
            albums,
            eq(tracks.albumId, albums.id)
        )
        .innerJoin(
            artists,
            eq(albums.artistId, artists.id)
        )

    return result ?? null;
}

export async function searchLibrary(query: string){
    const search = `%${query}%`;

    const [artistResults, albumResults, trackResults] = await Promise.all([
        db
          .select({
            id: artists.id,
            name: artists.name,
          })
          .from(artists)
          .where(ilike(artists.name, search)),

        db
          .select({
            id: albums.id,
            title: albums.title
          })
          .from(albums)
          .where(ilike(albums.title, search)),

        db
          .select({
            id: tracks.id,
            title: tracks.title,
            albumId:  tracks.albumId,
          })
          .from(tracks)
          .where(ilike(tracks.title, search)),
    ]);

    return {
        artists: artistResults,
        albums: albumResults,
        tracks: trackResults,
    };
}

export async function getTrackForStreaming(id: string) {
    const [result] = await db
      .select({
        id: tracks.id,
        filePath: tracks.filePath,
        fileSizeBytes: tracks.fileSizeBytes,
        format: tracks.format,
      })
      .from(tracks)
      .where(eq(tracks.id, id));

      return result ?? null;
}