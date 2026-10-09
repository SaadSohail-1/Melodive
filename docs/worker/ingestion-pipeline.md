# Melodive — Ingestion Pipeline Updates (Phase 2)

## 1. Architectural Upgrades
The worker pipeline has been upgraded from a naive "scan everything" approach to a highly optimized, delta-based ingestion engine. It now supports intelligent job delegation, local/embedded artwork extraction, and digital fingerprinting to prevent redundant processing.

### Ignored Files Behavior
The `isAudioFile` utility acts as a strict gatekeeper. Files like `.nfo`, `.m3u`, `.log`, and `.jpg` are naturally bypassed during the recursive directory walk, ensuring only valid audio formats (`.flac`, `.mp3`, etc.) are sent to FFprobe.

---

## 2. Job System Bug Fixes
*   **The JSON Serialization Crash:** The raw SQL query used in `completeJob()` crashed when attempting to pass the worker's JSON result object to the `pg` driver.
*   **The Fix:** Refactored `completeJob()` in `apps/worker/src/jobs/job.worker.ts` to use Drizzle ORM's query builder (`db.update(jobs).set(...)`), which natively handles JSONB serialization safely.
*   **Schema Update:** Added the missing `completed_at` (timestamp) column to the `jobs` table in `@melodive/db/src/schema.ts`, generated the migration, and executed it via `npm run db:migrate`. 
*   **Type Resolution:** Recompiled the DB package (`npm run build --workspace=@melodive/db`) so the worker workspace could resolve the updated schema types.

---

## 3. Artwork Extraction Pipeline (`FETCH_ARTWORK`)
Instead of extracting artwork synchronously and blocking the scanner, artwork processing was moved to a dedicated child job. 

### Implementation Details
*   **Metadata Detection:** Updated `extractMetadata()` to flag `hasArtwork: true` if FFprobe detects a `video` stream inside the audio file.
*   **Storage Path:** The artwork cache is stored in the project's configured storage directory(/storage/artowork).
*   **The Hierarchy of Extraction:**
    1.  The worker checks the audio file's directory for local art (`cover.jpg`, `folder.jpg`, `front.jpg`, `cover.png`). If found, it copies it and exits early.
    2.  If no local file is found, it executes `ffmpeg -i <file> -an -vcodec copy <output.jpg>` to cleanly rip the embedded binary from the audio metadata without re-encoding it.
*   **Database Integration:** Upon successful extraction/copy, the absolute path is stored in the `albums.artwork_path` column.

---

## 4. Delta Scans & Checksums (Performance Optimization)
The scanner was rewritten to use SHA-256 digital fingerprinting. This eliminates the N+1 query problem and prevents the worker from running FFprobe on unchanged files.

### Implementation Details
*   **The Hash Generator:** Implemented `calculateFileHash()` in `apps/worker/src/library/checksum.ts` using Node's native `crypto` module and `createReadStream`. Streaming the file prevents memory bloat on large FLAC files.
*   **The In-Memory Cache (Dictionary):**
    *   *Before* the scan loop begins, the worker executes a single bulk `SELECT` with a `LEFT JOIN` to fetch existing tracks and their parent albums for the target directory.
    *   This data is mapped into a JavaScript `Map` (Dictionary), where the `filePath` is the key, and the value is the full database object: `{ hash, albumId, artworkPath }`.
*   **The Skip Logic:**
    *   Inside the directory loop, the scanner hashes the local file and compares it to the dictionary.
    *   If the hashes match, the worker uses `continue` to bypass FFprobe and database insertion entirely.
*   **Self-Healing Artwork Logic:**
    *   Even if an audio file is skipped due to a matching hash, the worker checks the cached dictionary to see if the album is missing an `artworkPath`. 
    *   If artwork is missing, it dynamically queues a `FETCH_ARTWORK` job before skipping to the next file.