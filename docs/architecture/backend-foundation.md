# Melodive Backend Foundation

> Status: Initial backend foundation implemented
> Stack: TypeScript + Fastify + Drizzle ORM + PostgreSQL
> Last updated: September 2026

---

## 1. Overview

Melodive is a self-hosted music streaming application designed around a clear separation between:

* HTTP/API handling
* Business logic
* Database access
* Background processing
* Music/file storage
* Audio processing

The backend is being built with **Fastify + TypeScript**, with **PostgreSQL** as the persistent database and **Drizzle ORM** as the database access layer.

The backend architecture is designed to support:

* User authentication
* Music library management
* Library scanning
* Audio streaming
* Playlists
* Favorites
* Listening history
* Wrapped-style statistics
* Background jobs
* Metadata processing
* Artwork extraction
* Waveform generation
* Audio analysis
* Future acquisition/import workflows

The backend is being built incrementally, with the database schema and architecture established before implementing the higher-level music functionality.

---

# 2. Technology Stack

| Technology          | Purpose                                  |
| ------------------- | ---------------------------------------- |
| TypeScript          | Main backend language                    |
| Node.js             | Runtime                                  |
| Fastify             | HTTP server/framework                    |
| PostgreSQL          | Primary database                         |
| Drizzle ORM         | Type-safe database access                |
| Drizzle Kit         | Database migration tooling               |
| `pg`                | PostgreSQL connection pool               |
| Argon2              | Password hashing                         |
| `@fastify/cookie`   | HTTP cookie handling                     |
| `@fastify/sensible` | Fastify HTTP errors/utilities            |
| FFmpeg              | Audio processing/transcoding             |
| Docker              | Local PostgreSQL development environment |

---

# 3. Repository Structure

The current repository follows a monorepo structure:

```text
Melodive/
├── apps/
│   ├── server/
│   ├── web/
│   └── worker/
│
├── docs/
│   ├── ERD/
│   └── sequence diagrams/
│
├── infrastructure/
│   └── docker/
│
├── packages/
│   └── shared/
│
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── .gitignore
```

### Applications

#### `apps/server`

The Fastify API server.

Responsibilities include:

* Authentication
* API endpoints
* Request validation
* Database interaction
* Streaming requests
* Job creation
* Application/business logic

#### `apps/web`

The React frontend.

It will communicate with the Fastify API.

#### `apps/worker`

The background worker.

It will eventually handle expensive/asynchronous tasks such as:

* Library scanning
* Metadata processing
* Artwork processing
* Waveform generation
* Audio analysis
* Other background jobs

---

# 4. Backend Source Structure

The server currently follows this structure:

```text
apps/server/
├── src/
│   ├── index.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   └── database.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   │
│   ├── plugins/
│   │   ├── database.ts
│   │   └── auth.ts
│   │
│   ├── routes/
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   └── me.ts
│   │
│   ├── controllers/
│   │   └── auth.controller.ts
│   │
│   ├── services/
│   │   └── auth/
│   │       ├── password.ts
│   │       ├── auth.service.ts
│   │       └── session.service.ts
│   │
│   └── types/
│       └── fastify.d.ts
│
├── drizzle/
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

# 5. Application Architecture

The backend follows this general request flow:

```text
HTTP Request
     │
     ▼
 Fastify
     │
     ▼
   Route
     │
     ▼
 Controller
     │
     ▼
  Service
     │
     ▼
  Drizzle
     │
     ▼
 PostgreSQL
```

Each layer has a specific responsibility.

## Routes

Routes define:

* HTTP method
* URL
* Request schema
* Fastify hooks
* Controller associated with the endpoint

Example:

```text
POST /api/auth/login
```

Routes should not contain complicated business logic.

---

## Controllers

Controllers handle HTTP concerns.

Typical controller responsibilities:

1. Read request data
2. Call the appropriate service
3. Handle the result
4. Return the HTTP response

For example:

```text
HTTP request
     ↓
controller
     ↓
auth service
     ↓
HTTP response
```

Controllers should not contain large amounts of database/business logic.

---

## Services

Services contain application/business logic.

For authentication, for example:

```text
auth.service.ts
```

handles operations such as:

* Creating users
* Finding users
* Verifying passwords
* Creating sessions

This allows the HTTP layer and business logic to remain separated.

---

# 6. Fastify Application Composition

The Fastify application is constructed in:

```text
src/app.ts
```

while:

```text
src/index.ts
```

is responsible for actually starting the server.

The separation is intentional.

## `app.ts`

Responsible for:

* Creating the Fastify instance
* Registering plugins
* Registering routes
* Building the application

Conceptually:

```text
buildApp()
   │
   ├── cookie plugin
   ├── database plugin
   ├── authentication plugin
   ├── health routes
   ├── authentication routes
   └── other routes
```

## `index.ts`

Responsible for:

```text
build application
      ↓
start listening
```

This separation will make automated testing easier because tests can create the Fastify application without opening a real network port.

---

# 7. Fastify Plugins

Fastify plugins are being used for application infrastructure.

Examples:

```text
plugins/
├── database.ts
└── auth.ts
```

## Database Plugin

The database plugin decorates Fastify with the Drizzle database instance.

Conceptually:

```text
Fastify
   │
   └── app.db
          │
       Drizzle
          │
       pg Pool
          │
      PostgreSQL
```

This allows application components to access database functionality through the Fastify application context.

---

# 8. PostgreSQL Connection

The PostgreSQL connection is managed using the `pg` package.

The connection configuration is stored in environment variables:

```env
DATABASE_HOST=<DB_HOST>
DATABASE_PORT=<DB_PORT>
DATABASE_NAME=<DB_NAME>
DATABASE_USER=<DB_USER>
DATABASE_PASSWORD=<DB_PASSWORD>

DATABASE_URL=<DB_URL>
```

The application uses the `pg` connection pool.

Drizzle sits on top of this pool.

Therefore:

```text
Fastify
   ↓
Drizzle ORM
   ↓
node-postgres (`pg`)
   ↓
PostgreSQL
```

---

# 9. Local PostgreSQL

PostgreSQL is running inside Docker for development.

The database service is defined in:

```text
infrastructure/docker/compose.yml
```

The development container is:

```text
melodive-postgres
```

The database configuration is:

```text
Database: melodive
User:     melodive
Password: melodive_dev
Port:     5432
```

The PostgreSQL data is stored in a Docker volume so that restarting/removing the container does not automatically remove the database data.

---

# 10. Database Schema

The database is designed around several domains.

```text
┌───────────────────────────────────────────────┐
│                   Auth                        │
│ users                                         │
│ sessions                                      │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│              Library & Audio                 │
│ library_sources                               │
│ artists                                       │
│ albums                                        │
│ tracks                                        │
│ track_artists                                 │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│             Playback & Statistics             │
│ listening_events                              │
│ user_playback_states                          │
│ playlists                                     │
│ playlist_tracks                               │
│ favorites                                     │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│            Processing / Worker                │
│ jobs                                          │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│             Acquisition System                │
│ acquisition_requests                           │
│ acquisition_items                              │
└───────────────────────────────────────────────┘
```

The complete ERD is stored separately under:

```text
docs/ERD/
```

---

# 11. Authentication Database Model

## Users

The `users` table stores:

* User ID
* Username
* Email
* Password hash
* Admin status
* Preferences
* Creation/update timestamps

Passwords are **never stored as plaintext**.

The database stores an Argon2 password hash.

---

# 12. Password Security

Melodive uses Argon2 for password hashing.

Registration:

```text
Plain password
      │
      ▼
    Argon2
      │
      ▼
Password hash
      │
      ▼
 PostgreSQL
```

Login:

```text
Entered password
       │
       ▼
Argon2 verification
       ▲
       │
Stored password hash
```

The password is not decrypted.

The verification algorithm uses the information contained in the stored hash to determine whether the supplied password is correct.

---

# 13. Sessions

Melodive uses server-side sessions.

A successful login generates a cryptographically random session token.

The system separates:

```text
Client:
raw session token

Database:
SHA-256 hash of session token
```

The token is generated using Node's cryptographically secure random generator.

Conceptually:

```text
randomBytes()
     │
     ▼
session token
     │
     ├───────────────► Browser
     │
     ▼
SHA-256
     │
     ▼
sessions.token_hash
```

This means that a database leak does not directly expose usable session tokens.

---

# 14. Authentication Cookies

The session token is delivered using an HTTP cookie.

The cookie is configured with:

```text
HttpOnly
Secure (in production)
SameSite=Lax
Path=/
```

`HttpOnly` is particularly important.

It prevents normal frontend JavaScript from directly reading the session cookie.

Therefore the intended authentication model is:

```text
React
   │
   │ HTTP request
   ▼
Browser
   │
   │ automatically sends HttpOnly cookie
   ▼
Fastify
   │
   ▼
Session verification
```

Rather than storing the authentication token in `localStorage`.

---

# 15. Authentication Flow

## Registration

```text
Client
  │
  │ POST /api/auth/register
  ▼
Fastify
  │
  ▼
Request validation
  │
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ▼
Argon2
  │
  ▼
users table
  │
  ▼
201 Created
```

---

## Login

```text
Client
  │
  │ POST /api/auth/login
  ▼
Fastify
  │
  ▼
Validation
  │
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ├── Find user
  │
  └── Verify password
          │
          ▼
      Argon2
          │
          ▼
     Create session
          │
          ▼
      Set cookie
          │
          ▼
       Response
```

---

# 16. Protected Routes

Authentication is implemented as a Fastify decorator/hook.

Protected routes can use:

```text
onRequest: [app.authenticate]
```

The authentication process is:

```text
Request
   │
   ▼
Read session cookie
   │
   ▼
Hash session token
   │
   ▼
Find session
   │
   ▼
Check expiration
   │
   ├── Invalid → 401
   │
   └── Valid
        │
        ▼
   request.user
        │
        ▼
    Route handler
```

The authenticated user's ID is attached to the request.

---

# 17. Authentication Endpoints

Current authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

A protected user endpoint is also available:

```text
GET /api/users/me
```

The `/me` endpoint is primarily useful for verifying that the session authentication mechanism works.

---

# 18. Request Validation

Fastify's JSON Schema validation is used at the route level.

For example, registration validates:

```text
username
email
password
```

before the controller executes.

The request flow becomes:

```text
HTTP Request
     │
     ▼
Fastify Schema Validation
     │
     ├── Invalid → 400
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Database
```

This prevents invalid request data from unnecessarily reaching business logic.

---

# 19. Database ORM: Drizzle

Drizzle ORM is used as the type-safe database layer.

The schema is defined in:

```text
src/db/schema.ts
```

The Drizzle database instance is created in:

```text
src/db/index.ts
```

The general relationship is:

```text
schema.ts
     │
     ▼
 Drizzle ORM
     │
     ▼
 PostgreSQL
```

Drizzle provides a TypeScript interface over SQL operations while still keeping the generated SQL/migrations visible.

---

# 20. Database Migrations

Drizzle Kit is used to manage database migrations.

The configuration is:

```text
apps/server/drizzle.config.ts
```

The migration directory is:

```text
apps/server/drizzle/
```

The basic workflow is:

```text
Modify schema.ts
       │
       ▼
drizzle-kit generate
       │
       ▼
SQL migration
       │
       ▼
Review SQL
       │
       ▼
drizzle-kit migrate
       │
       ▼
PostgreSQL
```

The migration files should be committed to Git.

Once a migration has been applied/shared, it should not be casually rewritten. Future database changes should be represented by new migrations.

---

# 21. Database Design Principles

Several decisions were made intentionally during the ERD design.

## Track artists

Tracks do not contain a direct `artist_id`.

Instead:

```text
tracks
   │
   ▼
track_artists
   │
   ▼
artists
```

This supports:

```text
Artist A
Artist B
Artist C
```

being associated with a single track.

It also allows artist roles such as:

```text
primary
featured
composer
```

without duplicating the artist relationship in the `tracks` table.

---

## Album artist

Albums have a direct:

```text
artist_id
```

representing the album's primary/album artist.

This avoids introducing an unnecessary `album_artists` many-to-many table at this stage.

---

## Favorites

Favorites do not use a polymorphic:

```text
target_type
target_id
```

design.

Instead, the table has nullable foreign keys:

```text
track_id
album_id
artist_id
```

with the intended rule that exactly one target should be populated.

This allows PostgreSQL to maintain actual foreign-key relationships.

---

## File storage

Music files are not stored inside PostgreSQL.

The database stores paths and metadata.

For example:

```text
PostgreSQL
    │
    ├── file_path
    ├── file_size
    ├── format
    ├── bitrate
    └── metadata
```

while the actual audio remains in filesystem storage.

The same principle applies to generated assets such as:

* Artwork
* Waveforms
* Other binary processing results

---

# 22. Library Sources

A `library_sources` table represents a root directory managed by Melodive.

For example:

```text
library_sources

id
name
path
enabled
```

A source might represent:

```text
/music
```

Tracks reference their source through:

```text
tracks.library_source_id
```

This allows Melodive to support multiple music roots in the future without hard-coding one directory into the application.

---

# 23. Playback Data Model

## `listening_events`

Stores historical playback information.

It is intended to support:

* Recently played
* Listening history
* Total listening time
* Most played tracks
* Most played artists
* Most played albums
* Wrapped-style statistics

Conceptually:

```text
User
 │
 ▼
Listening events
 │
 ▼
Statistics
 │
 ▼
Wrapped
```

---

## `user_playback_states`

Stores the user's current playback state.

Examples:

* Current track
* Playback position
* Playing/paused state
* Volume
* Device identifier

The distinction is:

```text
listening_events
    = historical information

user_playback_states
    = current state
```

---

# 24. Playlist Model

Playlists are owned by users.

```text
users
  │
  ▼
playlists
  │
  ▼
playlist_tracks
  │
  ▼
tracks
```

`playlist_tracks` contains the position of a track within a playlist.

The current design allows the possibility of the same track appearing multiple times in a playlist.

This can be changed later if a uniqueness constraint is desired.

---

# 25. Background Job Architecture

Melodive will use a database-backed job system.

The intended architecture is:

```text
Fastify
   │
   │ create job
   ▼
PostgreSQL
   │
   │ job queue
   ▼
Worker
   │
   ├── Scan library
   ├── Extract artwork
   ├── Generate waveform
   ├── Analyze audio
   └── Other processing
```

The HTTP server should not perform expensive processing synchronously.

Instead:

```text
HTTP request
     │
     ▼
Create job
     │
     ▼
202 Accepted
     │
     ▼
Worker processes job
```

This prevents long-running operations from blocking API requests.

---

# 26. Planned Job Lifecycle

Jobs will follow a lifecycle similar to:

```text
PENDING
   │
   ▼
PROCESSING
   │
   ├── success → COMPLETED
   │
   └── error
         │
         ▼
      retry
         │
         ▼
      PENDING

After maximum retries:

FAILED
```

The job model includes fields for:

* Status
* Priority
* Payload
* Result
* Error information
* Retry count
* Maximum retries
* Scheduled execution time
* Lock information
* Start time
* Completion time

Workers will eventually claim jobs using PostgreSQL row locking with a pattern based on:

```sql
SELECT ...
FOR UPDATE SKIP LOCKED
```

This allows multiple workers to safely process jobs concurrently.

---

# 27. Library Ingestion Architecture

The planned library ingestion flow is:

```text
User
 │
 │ request scan
 ▼
Fastify
 │
 │ create SCAN_LIBRARY job
 ▼
PostgreSQL
 │
 │ 202 Accepted
 ▼
Worker
 │
 │ claim job
 ▼
Library source
 │
 │ scan filesystem
 ▼
Audio files
 │
 ▼
Metadata extraction
 │
 ├── title
 ├── artist
 ├── album
 ├── track number
 ├── disc number
 ├── artwork
 └── technical audio metadata
 │
 ▼
PostgreSQL
 │
 ├── artists
 ├── albums
 ├── tracks
 └── track_artists
```

Additional processing jobs can then be created for:

```text
Artwork
Waveform
Audio analysis
```

---

# 28. Important Architectural Boundary

Normal playback does **not** need to go through the background worker.

For example:

```text
GET /api/tracks/:id/stream
```

should be handled directly by the API/audio streaming layer.

The worker is for expensive asynchronous work.

Therefore:

```text
Playback
React → Fastify → Filesystem/FFmpeg
```

while:

```text
Library scanning
Fastify → Job → Worker → Filesystem/Database
```

This distinction is important for performance.

---

# 29. Current Backend State

At this stage the following foundation has been established:

* [x] Monorepo structure
* [x] TypeScript configuration
* [x] Fastify server
* [x] Docker PostgreSQL
* [x] PostgreSQL connection pool
* [x] Drizzle ORM
* [x] Drizzle Kit
* [x] Database schema
* [x] Database migration configuration
* [x] Fastify application factory
* [x] Fastify database plugin
* [x] Route plugin structure
* [x] Password hashing with Argon2
* [x] User registration
* [x] Login
* [x] Server-side sessions
* [x] Hashed session tokens
* [x] HttpOnly authentication cookie
* [x] Authentication decorator
* [x] Protected route
* [x] Logout

---

# 30. Immediate Next Steps

The next major backend phase is **Library Ingestion**.

Planned order:

```text
1. Job service
       ↓
2. Worker process
       ↓
3. Job claiming/locking
       ↓
4. Library scan job
       ↓
5. Filesystem scanner
       ↓
6. Metadata extraction
       ↓
7. Artist/album/track upserts
       ↓
8. Artwork processing job
       ↓
9. Waveform processing job
       ↓
10. Audio analysis
```

After ingestion is working, the backend can begin exposing real music data through API endpoints.

---

# 31. Engineering Principles

The following principles should guide future implementation.

### Keep HTTP and business logic separate

```text
Route → Controller → Service
```

### Keep expensive work out of HTTP requests

```text
Request → Job → Worker
```

### Keep binary media outside PostgreSQL

```text
DB → metadata/path
Filesystem → actual media
```

### Prefer database-enforced relationships

Use proper PostgreSQL foreign keys and constraints instead of application-only assumptions wherever practical.

### Keep migrations version-controlled

Database structure changes should be represented by migrations and committed alongside the code.

### Avoid premature microservices

The initial architecture uses separate application processes where there is a clear reason:

```text
Fastify Server
Worker
```

More services should only be introduced when there is a concrete scalability or deployment requirement.

---

# 32. Current High-Level Architecture

```text
                         ┌──────────────┐
                         │    React     │
                         │   Frontend   │
                         └──────┬───────┘
                                │
                                │ HTTP
                                ▼
                       ┌─────────────────┐
                       │     Fastify     │
                       │      API        │
                       └───────┬─────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
              Routes      Controllers     Plugins
                                │             │
                                ▼             ▼
                            Services        Drizzle
                                              │
                                              ▼
                                        ┌───────────┐
                                        │ PostgreSQL│
                                        └───────────┘

                       Background processing:

                       ┌───────────┐
                       │ PostgreSQL│
                       │   Jobs    │
                       └─────┬─────┘
                             │
                             ▼
                       ┌───────────┐
                       │  Worker   │
                       └─────┬─────┘
                             │
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
              Filesystem   FFmpeg     Metadata
```

This architecture provides the foundation for the actual Melodive music functionality while keeping the API server, database, media storage, and background processing responsibilities clearly separated.
