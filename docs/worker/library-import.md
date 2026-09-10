# Melodive Library Import

The library import system is responsible for turning audio files on disk into structured records in the Melodive database.

The current implementation focuses on:
1. Finding audio files
2. Extracting metadata
3. Creating/updating database records

## Current Flow

```text
Audio File
    │
    ▼
Library Scanner
    │
    ▼
Audio File Path
    │
    ▼
FFprobe
    │
    ▼
Audio Metadata
    │
    ▼
Track Importer
    │
    ├── Artist
    ├── Album
    ├── Track
    └── Track Artist Credit
    │
    ▼
PostgreSQL
```

## Supported Audio Formats

The scanner currently recognizes:
- `.mp3`
- `.flac`
- `.wav`
- `.m4a`
- `.aac`
- `.ogg`
- `.opus`

The list can be expanded later.

## Directory Scanning

The scanner recursively walks a library directory:

```text
/music/
├── Artist A/
│   ├── Album 1/
│   │   ├── 01.flac
│   │   └── 02.flac
│   │
│   └── Album 2/
│       └── 01.flac
│
└── Artist B/
    └── Album 1/
        └── 01.mp3
```

The scanner returns audio file paths; directories and unsupported files are ignored.

## Metadata Extraction

Metadata is extracted using `ffprobe`. The worker executes `ffprobe` with JSON output:

```text
ffprobe ──► JSON ──► AudioMetadata
```

The current metadata model includes:
- `title`
- `artist`
- `album`
- `albumArtist`
- `trackNumber`
- `discNumber`
- `year`
- `durationSeconds`
- `format`
- `bitrate`
- `sampleRate`
- `channels`
- `bitDepth`

## Metadata Normalization

Different audio formats may use slightly different tag names. The metadata extractor normalizes tag names by:
- Converting them to lowercase
- Removing spaces
- Removing underscores (`_`)
- Removing hyphens (`-`)

For example:
- `ALBUM ARTIST`
- `album_artist`
- `album-artist`
- `albumartist`

All normalize consistently to:
```text
albumartist
```

## Artist Resolution

The importer first determines the artist. The preferred artist is:

```text
albumArtist ?? artist
```

The album artist is preferred when available. If the artist already exists in the database, it is reused; otherwise, a new artist record is created.

```text
Find artist
    │
    ├── found → reuse
    │
    └── not found → create
```

## Album Resolution

An album is resolved using:
```text
album title + album artist
```

For example, `"Among My Swan"` + `"Mazzy Star"` identifies the album. If the album does not exist, it is created.

## Track Resolution

Tracks are currently resolved using their `file_path`. The path is unique in the database:
- **Same file path** $\rightarrow$ Existing track
- **Different file path** $\rightarrow$ New track

If an existing track is found, its metadata is updated. If it does not exist, a new track is inserted.

## Track Artist Credits

Track artists are stored separately through `track_artists`. This allows a track to have multiple artists:

```text
Track
 ├── Artist A → primary
 ├── Artist B → featured
 └── Artist C → remixer
```

The current basic importer creates `role = "primary"` for the resolved artist. More detailed artist-credit parsing can be added later.

## Database Transaction

The import operation is performed inside a single transaction:

```text
BEGIN
  │
  ├── resolve/create artist
  │
  ├── resolve/create album
  │
  ├── resolve/update track
  │
  └── create artist credit
  │
COMMIT
```

If any operation fails:
```text
ROLLBACK
```

This prevents partially imported records (e.g., if track creation fails after creating an artist and album, the transaction rolls back those changes).

## Idempotency

The importer is designed so that scanning the same file again does not create duplicate tracks. Existing tracks are found using the unique file path:

```text
First scan:  file.flac ──► INSERT
Second scan: file.flac ──► FIND ──► UPDATE
```

## Current Imported Data

For a valid FLAC file, the importer currently stores:
- **Artist:** Mazzy Star
- **Album:** Among My Swan
- **Track:** Flowers In December
- **Track number:** 2
- **Disc:** 1
- **Year:** 1996
- **Duration:** 297.907 seconds
- **Format:** FLAC
- **Bitrate:** 810128
- **Sample rate:** 44100
- **Channels:** 2
- **Bit depth:** 16

## Data Not Yet Calculated

The following fields exist in the database schema but are not populated by the basic importer yet:
- `file_size_bytes`
- `checksum_sha256`
- `waveform_path`
- `bpm`
- `loudness_lufs`
- `gain_db`

These will be handled by subsequent processing stages.

## Current Limitations

### Removed Files
The current importer does not detect files that have been removed from disk. Future scans should handle:
```text
Database track exists + File no longer exists ──► mark/remove track
```

### File Changes
The current importer does not yet use checksums or file modification metadata to efficiently detect changed files. A future implementation can use `checksum_sha256` to detect content changes.

### Artwork
Artwork extraction is not yet part of the importer. Future processing may extract:
- Embedded artwork
- `folder.jpg` / `cover.jpg`
- Other supported image formats

### Audio Analysis
BPM, loudness, waveform, and ReplayGain analysis are planned as separate background jobs.

## Planned SCAN_LIBRARY Pipeline

```text
SCAN_LIBRARY
      │
      ▼
Resolve Library Source
      │
      ▼
Recursively scan directory
      │
      ▼
For each audio file
      │
      ▼
Extract metadata
      │
      ▼
Import/update track
      │
      ├───────────────┐
      ▼               ▼
Artwork Job      Audio Analysis Job
                      │
                      ├── BPM
                      ├── Loudness
                      ├── Gain
                      └── Waveform
```

## Separation of Responsibilities

The library pipeline is intentionally split into stages:

* **Scanner:** Walking directories, finding audio files, filtering supported formats.
* **Metadata Extractor:** Running `ffprobe`, parsing metadata, normalizing tags.
* **Importer:** Database records, artist/album/track resolution, artist credits, transactions.
* **Processing Jobs:** Expensive asynchronous operations (artwork, waveforms, BPM, loudness).

## Current Status

### Implemented
- Recursive audio-file scanning
- Audio extension filtering
- `ffprobe` metadata extraction
- Tag normalization
- Artist creation/resolution
- Album creation/resolution
- Track creation/update
- Track artist relationship
- Transactional import
- Basic idempotency through unique file paths

### Planned
- `SCAN_LIBRARY` job handler
- Artwork processing
- Checksum calculation
- Waveform generation
- BPM detection
- Loudness analysis
- ReplayGain calculation
- Removed-file detection
- Changed-file detection
- Better multi-artist credit parsing
- Import progress reporting