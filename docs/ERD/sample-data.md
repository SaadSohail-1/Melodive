## Users

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "username": "saad",
  "email": "saad@example.com",
  "passwordHash": "$2b$12$examplehashedpassword",
  "isAdmin": true,
  "preferences": {
    "theme": "dark",
    "volume": 0.8,
    "autoplay": true
  },
  "createdAt": "2026-09-01T10:00:00Z",
  "updatedAt": "2026-09-15T18:30:00Z"
}
```

## sessions 
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440011",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "tokenHash": "$2b$12$examplehashedsessiontoken",
  "ipAddress": "192.168.1.10",
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151.0.0.0",
  "expiresAt": "2026-10-01T10:00:00Z",
  "createdAt": "2026-09-15T18:00:00Z"
}
```

## librarySources
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440011",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "tokenHash": "$2b$12$examplehashedsessiontoken",
  "ipAddress": "192.168.1.10",
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/151.0.0.0",
  "expiresAt": "2026-10-01T10:00:00Z",
  "createdAt": "2026-09-15T18:00:00Z"
}
```

## artists
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440031",
  "name": "Mazzy Star",
  "musicbrainzId": "f4f2e6a0-1234-4567-8901-123456789012",
  "biography": "American alternative rock band known for their dreamy and atmospheric sound.",
  "imagePath": "/music/artists/mazzy-star/artist.jpg",
  "createdAt": "2026-09-01T09:30:00Z",
  "updatedAt": "2026-09-10T14:00:00Z"
}
```

## albums
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440041",
  "title": "Among My Swan",
  "artistId": "550e8400-e29b-41d4-a716-446655440031",
  "releaseYear": 1996,
  "musicbrainzId": "a1b2c3d4-5678-90ab-cdef-123456789012",
  "artworkPath": "/music/artists/mazzy-star/among-my-swan/folder.jpg",
  "genres": [
    "Alternative Rock",
    "Dream Pop",
    "Neo-Psychedelia"
  ],
  "totalTracks": 12,
  "totalDiscs": 1,
  "createdAt": "2026-09-01T09:35:00Z",
  "updatedAt": "2026-09-10T14:05:00Z"
}
```

## tracks
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440051",
  "title": "Flowers in December",
  "albumId": "550e8400-e29b-41d4-a716-446655440041",
  "trackNumber": 1,
  "discNumber": 1,
  "durationSeconds": 261.533,
  "filePath": "/music/Mazzy Star/Among My Swan/01 - Flowers in December.flac",
  "librarySourceId": "550e8400-e29b-41d4-a716-446655440021",
  "fileSizeBytes": 32768452,
  "format": "FLAC",
  "bitrate": 987,
  "sampleRate": 44100,
  "channels": 2,
  "bitDepth": 16,
  "checkSumSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "waveformPath": "/waveforms/550e8400-e29b-41d4-a716-446655440051.png",
  "bpm": 88.50,
  "loudnessLufs": -14.20,
  "gainDb": -2.35,
  "createdAt": "2026-09-01T09:40:00Z",
  "updatedAt": "2026-09-10T14:10:00Z"
}
```

## trackArtists
```json
{
  "trackId": "550e8400-e29b-41d4-a716-446655440051",
  "artistId": "550e8400-e29b-41d4-a716-446655440031",
  "role": "primary"
}
```

## listeningEvents
```json
{
  "id": 1001,
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "trackId": "550e8400-e29b-41d4-a716-446655440051",
  "playedDurationSeconds": 258.210,
  "completionRatio": 0.987,
  "completed": true,
  "source": "playlist",
  "playedAt": "2026-09-15T20:15:32Z"
}
```

## userPlaybackStates
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "activeTrackId": "550e8400-e29b-41d4-a716-446655440051",
  "positionSeconds": 142.350,
  "isPlaying": true,
  "volume": 0.80,
  "deviceId": "fedora-laptop",
  "updatedAt": "2026-09-16T20:20:00Z"
}
```

## playlists
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440061",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Late Night",
  "decription": "Dreamy and atmospheric songs for late-night listening.",
  "isPublic": false,
  "coverImagePath": "/playlists/550e8400-e29b-41d4-a716-446655440061/cover.jpg",
  "createdAt": "2026-09-05T21:00:00Z",
  "updatedAt": "2026-09-15T22:30:00Z"
}
```

## playlistTracks
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440071",
  "playlistId": "550e8400-e29b-41d4-a716-446655440061",
  "trackId": "550e8400-e29b-41d4-a716-446655440051",
  "position": 1,
  "addedAt": "2026-09-05T21:05:00Z"
}
```

## favorites
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440081",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "trackId": "550e8400-e29b-41d4-a716-446655440051",
  "albumId": null,
  "artistId": null,
  "createdAt": "2026-09-10T19:30:00Z"
}
```

## jobs
```json
{
  "id": 2001,
  "type": "SCAN_LIBRARY",
  "status": "COMPLETED",
  "priority": 0,
  "payload": unknown,
  "result": unknown,
  "errorMessage": null,
  "attempts": 1,
  "maxRetries": 3,
  "runAt": "2026-09-15T10:00:00Z",
  "lockedBy": "worker-01",
  "lockedAt": "2026-09-15T10:00:02Z",
  "startedAt": "2026-09-15T10:00:02Z",
  "completedAt": "2026-09-15T10:04:37Z",
  "createdAt": "2026-09-15T10:00:00Z",
  "updatedAt": "2026-09-15T10:04:37Z"
}
```

