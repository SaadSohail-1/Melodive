import { useEffect, useRef, useState } from "react";
import { getTrackStreamUrl, type Track } from "../api/library";

interface MiniPlayerProps {
    track: Track | null;
}

function formatTime(seconds: number): string {
  if(!Number.isFinite(seconds)) {
    return "0:00"
  }

  const minutes = Math.floor(seconds/60);
  const remainingSeconds = Math.floor(seconds%60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function MiniPlayer({track}: MiniPlayerProps) {

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

    function handleTimeUpdate() {
      const audio = audioRef.current;
      if(!audio) return;
      setCurrentTime(audio.currentTime);
    }

    function handleLoadedMetadata() {
      const audio = audioRef.current;
      if(!audio) return;
      setDuration(audio.duration);
    }

    function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
      const audio = audioRef.current;
      if(!audio) return;
      const newTime = Number(event.target.value);

      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }

    if(!track) {
        return null;
    }

    return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        <div className="mb-3 flex items-center gap-4">
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
      <div className="flex items-center gap-3">
        <span className="w-10 text-right text-sm text-gray-500">
          {formatTime(currentTime)}
        </span>
        <input 
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
        />

        <span className="w-10 text-sm text-gray-500">
            {formatTime(duration)}
        </span>
      </div>
      </div>
    </div>
  );
}