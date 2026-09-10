import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    bigint,
    integer,
    smallint,
    numeric,
    jsonb,
    bigserial,
    inet,
    primaryKey,
    check,
    unique,
    index,
    customType,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    username: varchar("username", {length: 50}).notNull().unique(),

    email: varchar("email", {length: 255}).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255}).notNull(),

    isAdmin: boolean("is_admin").notNull().default(false),

    preferences: jsonb("preferences"),

    createdAt: timestamp("created_at", {withTimezone: true})
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", {withTimezone: true})
        .notNull()
        .defaultNow(),
})

export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    tokenHash: varchar("token_hash", {length: 255}).notNull(),

    ipAddress: inet("ip_address"),

    userAgent: text("user_agent"),

    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),

    createdAt: timestamp("created_at", {withTimezone: true})
        .notNull()
        .defaultNow(),
})

export const librarySources = pgTable("library_sources", {
    id: uuid().defaultRandom().primaryKey(),

    name: varchar("name", {length:300}).notNull(),

    path: text("path").notNull().unique(),

    enabled: boolean("enabled").notNull().default(true),

    createdAt: timestamp("created_at", {withTimezone: true})
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", {withTimezone: true})
        .notNull()
        .defaultNow(),
})

export const artists = pgTable("artists", {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {length: 255}).notNull(),

    musicbrainzId: varchar("musicbrainz_id", {length: 36}).unique(),

    biography: text("biography"),

    imagePath: text("image_path"),

    createdAt: timestamp("created_at", {withTimezone: true})
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", {withTimezone: true})
        .notNull()
        .defaultNow()
})

export const albums = pgTable("albums", {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", {length: 255}).notNull(),

    artistId: uuid("artist_id")
        .notNull()
        .references(() => artists.id),

    releaseYear: smallint("release_year"),

    musicbrainzId: varchar("musicbrainz_id", {length: 36}).unique(),

    artworkPath: text("artwork_path"),

    genres: text("genres").array(),

    totalTracks: smallint("total_tracks"),

    totalDiscs: smallint("total_discs"),

    createdAt: timestamp("created_at", {withTimezone: true})
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", {withTimezone: true})
        .notNull()
        .defaultNow()
})

export const tracks = pgTable("tracks", {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", {length: 255}).notNull(),

    albumId: uuid("album_id")
        .notNull()
        .references(() => albums.id),

    trackNumber: smallint("track_number"),

    discNumber: smallint("disc_number"),

    durationSeconds: numeric("numeric_seconds", {
        precision: 8,
        scale: 3,
    }).notNull(),
    //why do we have filePath AND librarySource id
    filePath: text("file_path").notNull().unique(),

    librarySourceId: uuid("library_source_id")
        .notNull()
        .references(() => librarySources.id),

    fileSizeBytes: bigint("file_size_bytes", {
        mode: "number",
    }),

    format: varchar("format", {length: 10}).notNull(),

    bitrate: integer("bitrate"),

    sampleRate: integer("sample_rate"),

    channels: smallint("channels"),

    bitDepth: smallint("bit_depth"),

    checkSumSha256: varchar("checksum_sha256", {length: 64}),

    waveformPath: text("waveform_path"),

    bpm: numeric("bpm", {
        precision: 5,
        scale: 2,
    }),

    loudnessLufs: numeric("loudness_lufs", {
        precision: 5,
        scale: 2,
    }),

    gainDb: numeric("gain_db", {
        precision: 5,
        scale: 2,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
})

export const trackArtists = pgTable("track_artists", {
    trackId: uuid("track_id")
        .notNull()
        .references(() => tracks.id, {onDelete: "cascade"}),

    artistId: uuid("artist_id")
        .notNull()
        .references(() => artists.id, {onDelete: "cascade"}),

    role: varchar("role", {length: 50}).notNull(),
},
    (table) => ({
        pk: primaryKey({
            columns: [table.trackId, table.artistId]
        }),
    }),
)

export const listeningEvents = pgTable("listening_events", {
    id: bigserial("id", {mode: "number"}).primaryKey(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {onDelete: "cascade"}),

    trackId: uuid("track_id")
        .notNull()
        .references(() => tracks.id),

    playedDurationSeconds: numeric("played_duration_seconds", {
        precision: 8,
        scale: 3,
    }).notNull(),

    completionRatio: numeric("completion_ratio", {
        precision: 4,
        scale: 3,
    }).notNull(),

    completed: boolean("completed").notNull(),
    //whats source
    source: varchar("source", {length: 50}),

    playedAt: timestamp("played_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
});

export const userPlaybackStates = pgTable("user_playback_states", {
    userId: uuid("user_id")
        .primaryKey()
        .references(() => users.id, {onDelete: "cascade"}),

    activeTrackId: uuid("active_track_id")
        .references(() => tracks.id),

    positionSeconds: numeric("position_seconds", {
        precision: 8,
        scale: 3
    }),

    isPlaying: boolean("is_playing").notNull().default(false),

    volume: numeric("volume", {
        precision: 3,
        scale: 2
    }),

    deviceId: varchar("device_id", {length: 100}),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).notNull().defaultNow()
})

export const playlists = pgTable("playlists", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .notNull()
            .references(() => users.id, {onDelete: "cascade"}),

    name: varchar("name", {length: 255}).notNull(),

    decription: text("description"),

    isPublic: boolean("is_public").notNull().default(false),

    coverImagePath: text("cover_image_path"),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
})

export const playlistTracks = pgTable("playlist_tracks", {
    id: uuid("id").defaultRandom().primaryKey(),

    playlistId: uuid("playlist_id")
        .notNull()
        .references(() => playlists.id, {onDelete: "cascade"}),

    trackId: uuid("track_id")
        .notNull()
        .references(() => tracks.id),

    position: integer("position").notNull(),

    addedAt: timestamp("added_at", {
        withTimezone: true,
    }).notNull().defaultNow()
})

export const favorites = pgTable("favorites", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {onDelete: "cascade"}),

    trackId: uuid("track_id")
        .references(() => tracks.id),

    albumId: uuid("album_id")
        .references(() => albums.id),

    artistId: uuid("artist_id")
        .references(() => artists.id),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow()
})

export const jobs = pgTable("jobs", {
    id: bigserial("id", {mode: "number"}).primaryKey(),

    type: varchar("type", {length: 50}).notNull(),

    status: varchar("status", {length: 20}).notNull(),

    priority: smallint("priority").notNull().default(0),

    payload: jsonb("payload"),

    result: jsonb("result"),

    errorMessage: text("error_message"),

    attempts: smallint("attempts").notNull().default(0),

    maxRetries: smallint("max_retries").notNull().default(3),

    runAt: timestamp("run_at", { withTimezone: true}),

    lockedBy: varchar("locked_by", {length: 100}),

    startedAt: timestamp("started_at", { withTimezone: true}),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
})