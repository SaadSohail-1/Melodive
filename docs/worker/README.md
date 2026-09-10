# Melodive Worker

The Melodive Worker is a separate background-processing application responsible for tasks that should not block the Fastify API.

## Why a Separate Worker?

Some operations in Melodive are potentially expensive or long-running:

- Scanning the music library
- Extracting audio metadata
- Processing artwork
- Generating waveforms
- Audio analysis
- Future indexing/processing tasks

These operations should not run directly inside an HTTP request.

The Fastify server creates a job in PostgreSQL and immediately returns a response. The Worker independently picks up pending jobs and processes them.

```text
React Web App
      │
      ▼
 Fastify API
      │
      │ creates job
      ▼
 PostgreSQL
      ▲
      │ claims job
      │
    Worker
      │
      ├── Filesystem
      ├── FFprobe / FFmpeg
      └── PostgreSQL
```

## Current Worker Structure

```text
apps/worker/
└── src/
    ├── db/
    │   └── index.ts
    │
    ├── jobs/
    │   └── service.ts
    │
    ├── library/
    │   ├── scanner.ts
    │   ├── metadata.ts
    │   ├── importer.ts
    │   ├── test-import.ts
    │   ├── test-scanner.ts
    │   ├── test-metadata.ts
    │   └── test-import.ts
    │
    └── index.ts
```

*The exact structure may evolve as the worker grows.*

## Implemented

### Database Connection
The worker connects directly to PostgreSQL using:
- `pg`
- `Drizzle ORM`

The worker maintains its own PostgreSQL connection pool.

### Job Claiming
The worker can safely claim jobs using PostgreSQL row locking:
```sql
FOR UPDATE SKIP LOCKED
```
This allows multiple workers to process jobs concurrently without claiming the same job.

### Job Lifecycle
Jobs currently follow this general lifecycle:

```text
PENDING
   │
   ▼
PROCESSING
   │
   ├── success ──► COMPLETED
   │
   └── error ────► retry / FAILED
```

### Library Scanner
The worker can recursively scan a directory and identify supported audio files.

Supported formats currently include:
- MP3
- FLAC
- WAV
- M4A
- AAC
- OGG
- OPUS

### Metadata Extraction
`ffprobe` is used to extract audio metadata.

Currently extracted metadata includes:
- Title
- Artist
- Album
- Album Artist
- Track number
- Disc number
- Year
- Duration
- Format
- Bitrate
- Sample rate
- Channels
- Bit depth

### Track Import
Extracted metadata can be imported into PostgreSQL.

The importer currently:
- Resolves or creates the artist
- Resolves or creates the album
- Resolves or creates the track
- Creates the track-to-artist relationship

The import is performed inside a database transaction.

## Planned

The worker will eventually support:
- Full `SCAN_LIBRARY` job handler
- Artwork extraction
- Waveform generation
- BPM analysis
- Loudness analysis
- ReplayGain calculation
- Checksum calculation
- Search indexing
- Library change detection
- Stale job recovery
- Job progress reporting
- More robust retry handling
- Multiple worker processes

## Important Design Principle

The Worker performs background processing.

The **Fastify server** remains responsible for:
- HTTP requests
- Authentication
- Authorization
- API responses
- Creating jobs
- Reading application data

The **Worker** is responsible for:
- Long-running processing
- Filesystem scanning
- Audio analysis
- Metadata processing
- Background jobs

This separation keeps the API responsive and allows background processing to scale independently.