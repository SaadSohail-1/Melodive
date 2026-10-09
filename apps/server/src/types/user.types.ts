export type SetPlaybackStateBody = {
    trackId: string;
    positionSeconds: string;
}
export type CreateListeningEventBody = {
    trackId: string;
    playedDurationSeconds: string;
}
export type GetListeningEventsQuery = {
    page?: number;
    limit?: number;
}
export type FavoriteParams = {
    id: string;
}
export type CreatePlaylistBody = {
    name: string;
    description: string;
    isPublic: boolean;
    coverImagePath: string;
}
export type UpdatePlaylistBody = {
    name?: string;
    description?: string;
    isPublic?: boolean
}
export type UpdatePlaylistParams = {
    id: string;
}
export type DeletePlaylistParams = {
    id: string;
}