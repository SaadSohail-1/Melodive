export interface Album {
    id: string;
    title: string;
    artist: {
        id: string;
        name: string;
    };
    releaseYear: number | null;
    artworkPath: string | null;
    totalTracks: number | null;
}

export interface Track {
    id: string;
    title: string;
    trackNumber: number;
    discNumber: number;
    durationSeconds: number;
    format: string;
}

export interface AlbumResponse {
    data: Album[];
    pagination: {
        page: number,
        limit: number,
        total: number;
        totalPages: number;
    };
}

export interface TracksResponse {
    data: Track[];
}

export async function getAlbums(): Promise<AlbumResponse> {
    const response = await fetch("/api/library/albums");
    if(!response.ok) {
        throw new Error("Failed to fetch album");
    }   
    return response.json();
}

export async function getAlbumTracks(
    albumId: string
): Promise<TracksResponse> {
    const response = await fetch(`/api/library/albums/${albumId}/tracks`);

    if(!response.ok) {
        throw new Error("Failed to fetch tracks");
    }
    return response.json();
}

export function getTrackStreamUrl(trackId: string): string {
    return `/api/library/tracks/${trackId}/stream`;
}