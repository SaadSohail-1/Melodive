import { albums, artists, db, trackArtists } from "@melodive/db";
import { count, countDistinct, eq } from "drizzle-orm";

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