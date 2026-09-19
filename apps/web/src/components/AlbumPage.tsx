import {useEffect, useState} from "react";
import {
    getAlbumTracks,
    type Album,
    type Track,
} from "../api/library";

interface AlbumPageProps {
    album: Album;
    onBack: () => void;
    onPlayTrack: (track: Track) => void;
}

function AlbumPage({album, onBack, onPlayTrack}: AlbumPageProps) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTracks(){
            try {
                const response = await getAlbumTracks(album.id);
                setTracks(response.data);
            } catch (error) {
                setError("Failed to load tracks");
                console.error(error)
            } finally {
                setLoading(false);
            }
        }
        loadTracks();
    }, [album.id])

    if (loading) {
        return <p className="p-8">Loading tracks...</p>;
    }

    if (error) {
        return <p className="p-8 text-red-500">{error}</p>;
    }

    return (
    <main className="p-8">
      <button
        onClick={onBack}
        className="mb-6 rounded border px-4 py-2"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold">{album.title}</h1>

      <p className="mt-1 text-gray-500">
        {album.artist.name}
      </p>

      <div className="mt-8">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => {onPlayTrack(track)}}
            className="flex w-full items-center gap-4 border-b py-3 text-left"
          >
            <span className="w-8 text-gray-500">
              {track.trackNumber}
            </span>

            <span className="font-medium">
              {track.title}
            </span>

            <span className="ml-auto text-sm text-gray-500">
              {track.format}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default AlbumPage