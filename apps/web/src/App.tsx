import { useEffect, useState } from "react";
import { getAlbums, type Album } from "./api/library";
import AlbumPage from "./components/AlbumPage";
import {MiniPlayer} from "./components/MiniPlayer";
import type { Track } from "./api/library";

function App() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    async function loadAlbums() {
      try {
        const response = await getAlbums();
        setAlbums(response.data);
      } catch (error) {
        setError("Failed to load albums");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadAlbums();
  }, []);

  if (loading) {
    return <p className="p-8">Loading albums...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>;
  }

  return (
    <main className="p-8">
      {
        selectedAlbum ? (
          <AlbumPage
            album={selectedAlbum}
            onBack={() => setSelectedAlbum(null)}
            onPlayTrack={setCurrentTrack}
          />
        ) : (
          <>
          <h1 className="mb-6 text-3xl font-bold">Albums</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => setSelectedAlbum(album)}
            className="rounded-lg border p-4 text-left"
          >
            <div className="mb-3 aspect-square rounded bg-gray-200" />

            <h2 className="font-semibold">{album.title}</h2>

            <p className="text-sm text-gray-500">
              {album.artist.name}
            </p>

            <p className="text-sm text-gray-500">
              {album.releaseYear ?? "Unknown year"}
            </p>
          </button>
        ))}
      </div>
          </>
        )
      }
      <MiniPlayer track={currentTrack}/>
    </main>
  );
}

export default App;