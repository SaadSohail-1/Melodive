# Melodive

Melodive is a self-hosted music streaming app that I'm building as a full-stack project.

The main idea is simple: keep my music locally, have a proper web interface for browsing and playing it, and build the backend around it instead of relying on an existing music server.
Basically im building my own server instead of using something like navidrome, plex, jellyfin etc.

I'm also using the project to learn and work with things that are easy to avoid in smaller projects, like background workers, media processing, database design, authentication, streaming, and system architecture.

## What I want to build

* Local music library
* Artists, albums, and tracks
* Search
* Audio streaming
* Play / pause / seek
* Playlists
* Favorites
* Recently played
* Shuffle and repeat
* Listening history and statistics
* Yearly "Wrapped"-style statistics
* Album artwork
* Audio analysis
* Waveform generation
* User authentication
* Keyboard shortcuts
* Responsive UI
* Remote access
* Automatic library scanning

Some of these are planned for later, so the project is being built incrementally.

## Architecture

The project is a TypeScript monorepo:

```text
Melodive/
│
├── apps/
│   ├── server/       # Fastify API
│   ├── web/          # React frontend
│   └── worker/       # Background jobs
│
├── packages/
│   └── shared/       # Shared TypeScript code
│
├── docs/
│   ├── ERD/
│   ├── sequence diagrams/
│   └── backend-foundation.md
│
└── infrastructure/
    └── docker/
```

The main backend flow is:

```text
React
  │
  ▼
Fastify
  │
  ├── Controllers
  │      ↓
  │   Services
  │      ↓
  │   Drizzle
  │      ↓
  │ PostgreSQL
  │
  └── Jobs
       ↓
     Worker
```

The API handles normal application requests such as authentication, browsing the library, playlists, playback state, etc.

Anything that can take a while, such as scanning the music folder or processing audio, is handled by the worker instead of blocking the API.

## Tech stack

| Technology  | Used for                            |
| ----------- | ----------------------------------- |
| TypeScript  | Application language                |
| React       | Frontend                            |
| Fastify     | Backend API                         |
| PostgreSQL  | Database                            |
| Drizzle ORM | Database access                     |
| Drizzle Kit | Migrations                          |
| Node.js     | Runtime                             |
| Argon2      | Password hashing                    |
| FFmpeg      | Audio processing                    |
| Docker      | Development database/infrastructure |
| Tailscale   | Remote access                       |

## Authentication

Authentication uses Argon2, server-side sessions, and HttpOnly cookies.

Passwords are hashed before being stored.

Session tokens are generated securely, and only their hashes are stored in the database.

```text
Password
   ↓
Argon2
   ↓
Password hash
   ↓
PostgreSQL
```

For sessions:

```text
Session token
     ↓
Hash
     ↓
PostgreSQL
```

## Database

PostgreSQL is the main database and Drizzle is used for the schema and database access.

The basic migration flow is:

```text
schema.ts
    ↓
Drizzle Kit
    ↓
SQL migration
    ↓
PostgreSQL
```

The database currently covers things such as:

* Users and sessions
* Artists
* Albums
* Tracks
* Track/artist relationships
* Playlists
* Favorites
* Listening history
* Playback state
* Background jobs
* Acquisition requests

Actual music files are kept on the filesystem rather than inside PostgreSQL.

## Development status

### Foundation

* [x] Monorepo setup
* [x] TypeScript
* [x] Fastify
* [x] PostgreSQL
* [x] Docker development database
* [x] Drizzle ORM
* [x] Database schema
* [x] Database migrations
* [x] Fastify plugin architecture
* [x] Authentication
* [x] Sessions
* [x] Protected routes

### Backend

* [x] Background job system
* [x] Worker process
* [x] Library scanner
* [x] Metadata extraction
* [x] Artwork processing
* [x] Audio analysis
* [x] Waveform generation
* [x] Music library API
* [x] Audio streaming
* [x] Range requests
* [x] Search API
* [x] Playlist API
* [ ] Listening statistics API

### Frontend

* [ ] Authentication UI
* [ ] Music library
* [ ] Player
* [ ] Queue
* [ ] Search
* [ ] Artist pages
* [ ] Album pages
* [ ] Playlists
* [ ] Favorites
* [ ] Statistics / Wrapped

### Testing and tooling

* [ ] API test collection
* [ ] Backend unit tests
* [ ] Integration tests
* [ ] React component tests
* [ ] Storybook
* [ ] CI/CD

## Library ingestion

The idea is that the API doesn't directly scan and process the entire music library. Instead, it creates a job and lets the worker handle it.

```text
Scan Request
     ↓
Create Job
     ↓
Worker picks up job
     ↓
Scan music directory
     ↓
Extract metadata
     ↓
Artists / Albums / Tracks
     ↓
Process artwork
     ↓
Audio analysis
     ↓
Generate waveform
```

This keeps the API responsive while the more expensive work happens in the background.

## Development approach

I'm trying to build Melodive incrementally rather than designing everything up front.

The main goals are:

* Keep the architecture reasonably simple.
* Separate HTTP handling from application logic.
* Keep expensive work in background jobs.
* Let PostgreSQL enforce data integrity where possible.
* Keep migrations version-controlled.
* Keep media files outside the database.
* Avoid adding microservices unless they are actually needed.
* Understand how each part works instead of just making it work.

## License

Currently intended for personal/self-hosted use.
