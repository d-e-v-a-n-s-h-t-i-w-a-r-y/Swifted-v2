import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextToSpeechControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onRateChange: (value: number) => void;
}

export function TextToSpeechControls({
  isPlaying,
  isPaused,
  rate,
  onPlay,
  onPause,
  onResume,
  onRateChange,
}: TextToSpeechControlsProps) {
  return (
    <div className="w-full bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3">
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={onPlay}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Play"
            >
              <Play size={18} className="ml-0.5" />
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Resume"
            >
              <Play size={18} className="ml-0.5" />
            </button>
          ) : (
            <button
              onClick={onPause}
              className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Pause"
            >
              <Pause size={18} />
            </button>
          )}
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed</span>
          <div className="flex gap-1">
            {[0.75, 1, 1.5].map((r) => (
              <button
                key={r}
                onClick={() => onRateChange(r)}
                className={cn(
                  "px-2.5 py-1.5 text-xs rounded-lg transition-colors",
                  rate === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
