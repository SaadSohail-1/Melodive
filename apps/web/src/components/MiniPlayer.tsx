import { useEffect, useRef, useState } from "react";
import { getTrackStreamUrl, type Track } from "../api/library";

interface MiniPlayerProps {
    track: Track | null;
}

export function MiniPlayer({track}: MiniPlayerProps) {

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if(!track || !audioRef.current){
            return;
        }
        const audio = audioRef.current;
        audio.src = getTrackStreamUrl(track.id);;
        audio.play()
        .then(() => {
            setIsPlaying(true);
        })
        .catch((error) => {
            console.error("Playback failed:", error);
        })
    }, [track]);

    function togglePlay(){
        if(!audioRef.current) {
            return;
        }
        if(audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }

    if(!track) {
        return null;
    }

    return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="rounded-full border px-4 py-2"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <div>
          <p className="font-semibold">{track.title}</p>

          <p className="text-sm text-gray-500">
            {track.format}
          </p>
        </div>
      </div>
    </div>
  );
}