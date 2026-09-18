### I'd split it into two versions

**v1 — simple PostgreSQL search**

```text
GET /api/search?q=pink+floyd
             ↓
       Fastify Server
             ↓
      PostgreSQL
       ILIKE queries
             ↓
 { artists, albums, tracks }
```

Search:

```text
artists.name
albums.title
tracks.title
```

This is completely reasonable for your first version, especially for a **local music library**.

---

**v2 — optimized/full-text search**

Your existing diagram:

```text
query
  ↓
sanitize/tokenize
  ↓
tsquery
  ↓
GIN indexes + tsvector
  ↓
trigram similarity
  ↓
ranking
  ↓
unified results
```

That's something I'd add **after you actually have enough library data / notice search limitations**.

### One thing I'd change in your diagram

Your diagram currently says:

> `Artists (Trigram & TSVector)`

and:

> `Albums (TSVector & Join)`

and:

> `Tracks (Title matches)`

That's already designing a **search engine**, not merely adding a search endpoint.

For v1, I'd keep the endpoint contract roughly the same:

```http
GET /api/search?q=pink+floyd&type=all
```

but implement it simply. Later you can replace the internals with FTS **without changing the frontend/API contract much**.

So I'd recommend we **start with the simple implementation**, then upgrade the database search when we reach the optimization stage.
