# Melodive Logger — Current Design & Usage

## Project context

Melodive is a TypeScript monorepo using:

* Fastify server
* PostgreSQL + Drizzle
* Separate worker process
* Local music files under `/music`
* Async job system
* Append-only JSONL logging

The logger is intended for **important application events, job lifecycle events, scan/import events, and failures**.

It is **NOT intended to log every SQL query or every HTTP request**.

PostgreSQL remains the source of truth for state. The JSONL logs are historical/debugging/audit-style event history.

---

# Logger architecture

Shared logger package:

```text
packages/logger/
├── src/
│   ├── logger.ts
│   ├── types.ts
│   └── index.ts
└── package.json
```

Server and worker each instantiate their own logger:

```text
                    @melodive/logger
                     /             \
                  server          worker
                     \             /
                      logs/*.jsonl
```

Current log files:

```text
logs/
├── server.jsonl
└── worker.jsonl
```

The server logger uses:

```ts
logDirectory: "../../logs"
```

because the server is run through its workspace and relative paths are based on `process.cwd()`.

The worker is currently run from the monorepo root with:

```bash
npx tsx apps/worker/src/index.ts
```

so its default:

```ts
logDirectory: "logs"
```

points to the root `logs/` directory.

---

# Logger types

```ts
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogSource = "server" | "worker";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    source: LogSource;
    event: string;
    details?: Record<string, unknown>;
}

export interface LogOptions {
    details?: Record<string, unknown>;
    error?: unknown;
}
```

---

# Logger implementation

The logger writes JSON Lines (`.jsonl`) and serializes errors.

Important behavior:

```ts
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
```

Configured level acts as the minimum severity.

For example:

```text
INFO logger
→ DEBUG ignored
→ INFO logged
→ WARN logged
→ ERROR logged
```

The logger uses an internal write queue so multiple writes are serialized.

One known nuance: the current `write()` implementation queues the append operation, but if we later care about guaranteeing that `await logger.info()` means the file write has completed, the implementation should await the queued promise appropriately.

---

# Main logging philosophy

Do NOT log things like:

```text
SELECT_ARTISTS
SELECT_ALBUM
SELECT_TRACK
SQL_QUERY
GET_ARTISTS
GET_ALBUMS
GET_TRACKS
```

for every normal operation.

That would make the logs noisy and less useful.

Instead, log **meaningful state transitions or important events**.

Think:

```text
Controller
    ↓
important request/event
    ↓
Service
    ↓
meaningful state change
    ↓
Database
```

---

# Server/controller logging

## Scan controller

Current controller:

```ts
export async function scanLibrary(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const body = request.body as {
        path?: string
    };

    const job = await createJob(
        "SCAN_LIBRARY",
        {
            path: body.path,
        },
    );

    if(!job) {
        await logger.error("JOB_CREATION_FAILED", {
            details: {
                path: body.path,
                route: "/api/library/scan"
            },
            error: new Error("could not create job")
        });

        return reply.code(500).send({
            error: "could not create job"
        });
    }

    await logger.info("LIBRARY_SCAN_REQUESTED", {
        details: {
            jobId: job.id,
            path: body.path
        }
    });

    return reply.code(202).send({
        job_id: job.id,
        status: job.status,
    });
}
```

This is a good place to log because scanning creates an asynchronous job.

Important events:

```text
LIBRARY_SCAN_REQUESTED
JOB_CREATION_FAILED
```

The normal read controllers do NOT currently need logging:

```text
getArtists
getArtist
getAlbums
getAlbum
getArtistAlbums
getAlbumTracks
getTracks
```

These are normal read operations and logging every successful request would create unnecessary noise.

Later, authentication or meaningful user actions can have events such as:

```text
LOGIN_SUCCESS
LOGIN_FAILED
PLAYLIST_CREATED
FAVORITE_ADDED
FAVORITE_REMOVED
```

---

# Job creation

`createJob()` should be responsible for logging:

```text
JOB_CREATED
```

because this is the function that actually inserts the job into PostgreSQL.

Desired flow:

```text
scanLibrary controller
        │
        ├── LIBRARY_SCAN_REQUESTED
        │
        ▼
    createJob()
        │
        └── JOB_CREATED
```

Do NOT log `JOB_CREATED` inside `claimNextJob()`.

---

# Worker job lifecycle

Current job lifecycle:

```text
LIBRARY_SCAN_REQUESTED
        ↓
JOB_CREATED
        ↓
JOB_CLAIMED
        ↓
SCAN_LIBRARY_STARTED
        ↓
scan/import work
        ↓
SCAN_LIBRARY_FINISHED
        ↓
JOB_COMPLETED
```

Failure:

```text
JOB_CLAIMED
        ↓
SCAN_LIBRARY_STARTED
        ↓
TRACK_IMPORT_FAILED / SCAN_LIBRARY_FAILED / etc.
        ↓
JOB_FAILED
        ↓
PENDING (retry)
   OR
FAILED (terminal)
```

---

# claimNextJob()

Current function claims a pending job using:

```sql
FOR UPDATE SKIP LOCKED
```

After a job is successfully claimed, log:

```text
JOB_CLAIMED
```

with:

```ts
{
    jobId,
    jobType,
    workerId
}
```

Important correction:

The current implementation previously had:

```ts
logger.info("JOB_CREATED", ...)
```

inside `claimNextJob()`.

That should be:

```ts
logger.info("JOB_CLAIMED", ...)
```

because the job was already created earlier.

---

# completeJob()

After successfully updating the job to `COMPLETED`, log:

```text
JOB_COMPLETED
```

with at minimum:

```ts
{
    jobId
}
```

Avoid dumping arbitrary large job results into logs unless there is a specific reason.

---

# failJob()

`failJob()` updates the job status to either:

```text
PENDING
```

if retries remain, or:

```text
FAILED
```

if maximum retries have been reached.

It should log:

```text
JOB_FAILED
```

with information such as:

```ts
{
    jobId,
    jobStatus,
    attempts,
    maxRetries
}
```

and include the actual error.

There was a typo that needed fixing:

```sql
RETURNING id, status, attempts, max_retries;
```

NOT:

```sql
RETURNING id, status, attemps, max_retries;
```

And application log field should preferably be:

```ts
attempts
maxRetries
```

rather than exposing DB naming style everywhere.

If the UPDATE itself returns no job, log:

```text
JOB_FAILURE_UPDATE_FAILED
```

---

# Library scan worker

`processScanLibraryJob()` currently logs meaningful scan events.

At the beginning:

```text
SCAN_LIBRARY_STARTED
```

Details:

```ts
{
    path: targetPath
}
```

After metadata extraction:

```text
EXTRACTED_METADATA
```

Details:

```ts
{
    path: filePath
}
```

When a job is queued for an existing track:

```text
QUEUED_GENERATE_WAVEFORM
QUEUED_ANALYZE_AUDIO
QUEUED_FETCH_ARTWORK
```

Use:

```ts
trackState: "existing"
```

for existing tracks.

For newly imported tracks:

```ts
trackState: "new"
```

Example:

```ts
await logger.info("QUEUED_GENERATE_WAVEFORM", {
    details: {
        path: filePath,
        trackState: "new"
    }
});
```

This lets logs distinguish:

```text
existing track
vs
new track
```

without making separate event names.

---

# Artwork deduplication

The scan uses:

```ts
const enqueuedAlbums = new Set<string>();
```

This prevents the same album from receiving multiple `FETCH_ARTWORK` jobs when several tracks belong to that album.

Example:

```text
album1/
├── track1.flac → FETCH_ARTWORK queued
├── track2.flac → already queued
└── track3.flac → already queued
```

The log should therefore only show one:

```text
QUEUED_FETCH_ARTWORK
```

for that album during the scan.

---

# Orphan cleanup

When files exist in the database but no longer exist on disk:

```text
ORPHANS_FOUND
```

Details:

```ts
{
    orphanCount: orphansToRemove.length
}
```

After deletion, no additional success log is currently required.

If deletion fails:

```text
ORPHAN_CLEANUP_FAILED
```

with:

```ts
{
    orphanCount: orphansToRemove.length
}
```

and the actual caught error.

There was a naming inconsistency:

```ts
orphansCount
```

should preferably be:

```ts
orphanCount
```

---

# Scan completion

At the end:

```text
SCAN_LIBRARY_FINISHED
```

Details:

```ts
{
    path: targetPath,
    filesFound: audioFiles.length,
    filesImported: successCount,
    orphansRemoved: orphansToRemove.length
}
```

This gives a useful scan summary.

---

# Per-file scan failure

If a particular file fails during scanning/import:

```text
SCAN_LIBRARY_FAILED
```

with:

```ts
{
    path: filePath
}
```

and the actual caught `error`.

The actual caught error should be passed:

```ts
error
```

rather than creating a new generic error, because the original error contains the useful message/stack.

---

# Importer logging

`importTrack()` is responsible for meaningful database changes caused by importing one track.

Current structure:

```text
importTrack()
    │
    ├── Artist created? → ARTIST_CREATED
    │
    ├── Album created?  → ALBUM_CREATED
    │
    ├── Track created/updated
    │       ↓
    │   TRACK_CREATED / TRACK_UPDATED
    │
    └── transaction failure
            ↓
      TRACK_IMPORT_FAILED
```

Current useful events:

## Artist

Only log when a new artist is actually inserted:

```text
ARTIST_CREATED
```

Details:

```ts
{
    artistId,
    artistName,
    path
}
```

Do NOT log the artist SELECT query.

---

## Album

Only log when a new album is actually inserted:

```text
ALBUM_CREATED
```

Details:

```ts
{
    albumId,
    albumTitle,
    artistId,
    path
}
```

Do NOT log the album SELECT query.

---

## Track

If the track doesn't exist and is inserted:

```text
TRACK_CREATED
```

If it already exists and is updated:

```text
TRACK_UPDATED
```

Details:

```ts
{
    trackId,
    albumId,
    artistId,
    path
}
```

The current implementation uses:

```ts
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
);
```

This is good.

---

# Track → artist relationship

The importer creates a `trackArtists` relationship if one doesn't already exist.

Currently this is NOT logged.

That is intentional.

There is no need for:

```text
TRACK_ARTIST_RELATION_CREATED
```

yet because it's an internal part of track import and would add unnecessary noise.

---

# Import failure

The entire transaction is wrapped in:

```ts
try {
    return await db.transaction(async (tx) => {
        ...
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
```

This is important because the transaction can roll back while the error still needs to be recorded.

---

# Important transaction/logging nuance

The JSONL logger is separate from PostgreSQL.

Therefore:

```text
DB transaction
      +
file logger
```

are NOT one atomic transaction.

For example:

```text
ARTIST_CREATED logged
ALBUM_CREATED logged
TRACK_CREATED logged
        ↓
later DB operation fails
        ↓
PostgreSQL ROLLBACK
```

The log may still contain the earlier events even though PostgreSQL rolled them back.

This is acceptable for the current Melodive design because the JSONL logger is primarily a:

* development log
* debugging history
* application event history

It is NOT the authoritative database audit trail.

PostgreSQL remains the source of truth.

---

# Current desired event vocabulary

## Server

```text
LIBRARY_SCAN_REQUESTED
JOB_CREATION_FAILED
```

## Job system

```text
JOB_CREATED
JOB_CLAIMED
JOB_COMPLETED
JOB_FAILED
JOB_FAILURE_UPDATE_FAILED
```

## Library scan

```text
SCAN_LIBRARY_STARTED
SCAN_LIBRARY_FINISHED
SCAN_LIBRARY_FAILED
EXTRACTED_METADATA
ORPHANS_FOUND
ORPHAN_CLEANUP_FAILED
```

## Import

```text
ARTIST_CREATED
ALBUM_CREATED
TRACK_CREATED
TRACK_UPDATED
TRACK_IMPORT_FAILED
```

## Child jobs

```text
QUEUED_GENERATE_WAVEFORM
QUEUED_ANALYZE_AUDIO
QUEUED_FETCH_ARTWORK
```

These can contain:

```ts
trackState: "existing" | "new"
```

where relevant.

---

# Overall expected log sequence for a new album

For a new album with multiple tracks, something like:

```text
LIBRARY_SCAN_REQUESTED
JOB_CREATED
JOB_CLAIMED

SCAN_LIBRARY_STARTED

EXTRACTED_METADATA
ARTIST_CREATED
ALBUM_CREATED
TRACK_CREATED
QUEUED_GENERATE_WAVEFORM
QUEUED_ANALYZE_AUDIO
QUEUED_FETCH_ARTWORK

EXTRACTED_METADATA
TRACK_CREATED
QUEUED_GENERATE_WAVEFORM
QUEUED_ANALYZE_AUDIO

EXTRACTED_METADATA
TRACK_CREATED
QUEUED_GENERATE_WAVEFORM
QUEUED_ANALYZE_AUDIO

SCAN_LIBRARY_FINISHED
JOB_COMPLETED
```

Notice that `ALBUM_CREATED` only happens once and `FETCH_ARTWORK` only happens once for the album.

---

# What should NOT be logged

Avoid logging every:

```text
SELECT
INSERT
UPDATE
DELETE
```

Avoid normal successful reads:

```text
GET_ARTISTS
GET_ALBUMS
GET_TRACKS
GET_ARTIST
GET_ALBUM
```

Avoid low-level internal operations unless debugging requires them.

The goal is that someone can read the log and understand:

> What important things happened in the application?

rather than:

> What SQL did the application execute?

---

# Current next steps

Before adding more logging:

1. Ensure `createJob()` logs `JOB_CREATED`.
2. Ensure `claimNextJob()` logs `JOB_CLAIMED`, not `JOB_CREATED`.
3. Fix the `attempts` typo in `failJob()`.
4. Run a scan of a genuinely new album.
5. Inspect `worker.jsonl`.
6. Run the same scan again to test the existing-track path.
7. Delete one track from disk and scan again to test `ORPHANS_FOUND`.
8. Test a failure path to verify `TRACK_IMPORT_FAILED` and `JOB_FAILED`.

Do not add more logger events just for the sake of having more logs. Add them when they represent a meaningful application event or state transition.
