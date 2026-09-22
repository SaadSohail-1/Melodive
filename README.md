# Melodive

**Melodive** is a self-hosted music streaming application built as an engineering-focused full-stack project.

The goal is to build a personal music platform with a modern streaming experience while exploring real-world backend architecture, media processing, databases, background jobs, authentication, testing, and system design.

---

## Planned Features

* Local music library
* Full-text music search
* Audio streaming
* Play / pause / seek
* Artists, albums, and tracks
* Album artwork
* Playlists
* Favorites
* Recently played
* Shuffle and repeat
* Listening statistics
* Wrapped-style yearly statistics
* Audio waveforms
* Audio analysis
* User authentication
* Responsive interface
* Keyboard shortcuts
* Remote access
* Background processing
* Automatic library scanning

---

## Architecture

Melodive uses a modular monorepo architecture:

```text
Melodive/
│
├── apps/
│   ├── server/       # Fastify API
│   ├── web/          # React frontend
│   └── worker/       # Background processing
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

### Backend

```text
React
  │
  ▼
Fastify API
  │
  ├── Controllers
  │       │
  │       ▼
  │    Services
  │       │
  │       ▼
  │    Drizzle
  │       │
  │       ▼
  │   PostgreSQL
  │
  └── Job Queue
          │
          ▼
        Worker
```

---

## Tech Stack

| Technology  | Purpose                    |
| ----------- | -------------------------- |
| TypeScript  | Application language       |
| React       | Frontend                   |
| Fastify     | Backend API                |
| PostgreSQL  | Database                   |
| Drizzle ORM | Database access            |
| Drizzle Kit | Migrations                 |
| Node.js     | Runtime                    |
| Argon2      | Password hashing           |
| FFmpeg      | Audio processing           |
| Docker      | Development infrastructure |
| Tailscale   | Remote access              |

---

## Documentation

Detailed project documentation is maintained under [`docs/`](docs/).

### Architecture

* [Backend Foundation](docs/backend-foundation.md)
* ERD — [`docs/ERD/`](docs/ERD/)
* Sequence Diagrams — [`docs/sequence%20diagrams/`](docs/sequence%20diagrams/)

The backend foundation document explains the current implementation, including:

* Fastify architecture
* Project structure
* PostgreSQL setup
* Drizzle ORM
* Database migrations
* Database design
* Authentication
* Sessions
* Cookies
* Fastify plugins
* Service/controller separation
* Planned background jobs
* Library ingestion architecture

---

## Authentication

Authentication uses:

```text
Argon2
   +
Server-side sessions
   +
HttpOnly cookies
```

Passwords are never stored in plaintext.

Session tokens are generated cryptographically and only their hashes are stored in PostgreSQL.

---

## Database

The primary database is PostgreSQL.

The schema is managed through Drizzle:

```text
schema.ts
    ↓
Drizzle Kit
    ↓
SQL migration
    ↓
PostgreSQL
```

The database contains domains for:

* Users and sessions
* Music library
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

---

## Development Status

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
* [ ] Playlist API
* [ ] Listening statistics API

### Frontend

* [ ] React application
* [ ] Authentication UI
* [ ] Music library
* [ ] Player
* [ ] Queue
* [ ] Search
* [ ] Artist pages
* [ ] Album pages
* [ ] Playlists
* [ ] Favorites
* [ ] Statistics/Wrapped

### Quality

* [ ] API test collection
* [ ] Backend unit tests
* [ ] Integration tests
* [ ] React component tests
* [ ] Storybook
* [ ] CI/CD

---

## Development Philosophy

Melodive is being developed with an emphasis on understanding the engineering behind the application rather than simply making the features work.

Important principles include:

* Keep the architecture modular.
* Separate HTTP handling from business logic.
* Keep expensive processing asynchronous.
* Use PostgreSQL constraints where appropriate.
* Keep migrations version-controlled.
* Keep actual media files outside the database.
* Avoid unnecessary microservices.
* Build the system incrementally.
* Test important behavior.
* Prefer explicit architecture over premature abstraction.

---

## Current Phase

**Phase: Backend Foundation → Library Ingestion**

The authentication and database foundation is established.

The next major milestone is the background job system and music library ingestion pipeline:

```text
Scan Request
     ↓
Create Job
     ↓
Worker
     ↓
Scan Music Directory
     ↓
Extract Metadata
     ↓
Artists / Albums / Tracks
     ↓
Artwork / Waveform / Audio Analysis
```

---

## License

This project is currently intended for personal/self-hosted use.
