Exactly. **This is a frontend vertical-slice test, not the start of full frontend development.**

We're basically building a **thin test UI** whose purpose is to prove:

```text
Existing Backend
      ↓
GET artists
GET albums
GET album/:id/tracks
GET track/:id
GET track/:id/stream
      ↓
React
      ↓
Album page
      ↓
Track list
      ↓
▶ Play
      ↓
Mini player
```

### What we should NOT do yet

Don't spend time on:

* polished Spotify-like UI
* proper design system
* Storybook
* responsive perfection
* Redux/Zustand architecture
* sophisticated routing
* authentication UI
* playlists
* favorites
* search UI
* listening history
* playback persistence
* fancy animations
* acquisition UI

Those come later.

### What we're trying to prove

By the end, you should be able to:

1. Open Melodive in the browser.
2. See the albums returned by the **real API**.
3. Click an album.
4. See its tracks from the **real API**.
5. Click ▶ on a track.
6. Browser requests:

```text
GET /api/library/tracks/:id/stream
```

7. Fastify retrieves the actual file.
8. HTTP streaming/Range handling works.
9. Audio plays in the browser.
10. Mini-player shows the currently playing track.

So this is essentially an **integration test with a UI attached**.

---

### I'd structure the work in small steps

```text
STEP 1
Set up minimal React app
        ↓
STEP 2
API client
        ↓
STEP 3
Albums page
        ↓
STEP 4
Album → tracks
        ↓
STEP 5
Track playback
        ↓
STEP 6
Minimal mini-player
        ↓
STEP 7
Test everything end-to-end
```

And importantly, **we should build one step at a time**, testing each one before moving on.

Since your `apps/web` is currently mostly empty, I'd start with **Step 1: inspect/set up the existing `apps/web` workspace**, rather than blindly generating a new React project and potentially messing with your monorepo.

Then we'll build the smallest possible frontend around the APIs you already have.
