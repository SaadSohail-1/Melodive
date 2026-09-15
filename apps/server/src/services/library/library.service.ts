import { artists, db } from "@melodive/db";

export async function getArtists() {
    const result = await db
        .select({
            id: artists.id,
            name: artists.name,
            imagePath: artists.imagePath,
        })
        .from(artists)
        .orderBy(artists.name);

    return result;
}
