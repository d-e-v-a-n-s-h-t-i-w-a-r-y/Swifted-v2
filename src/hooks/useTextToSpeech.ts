import { useState, useEffect, useCallback, useRef } from "react";

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();
    clearProgress();

    textRef.current = text;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = 1;

    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Natural")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);
      
      // Estimate progress
      const estimatedDuration = (text.length / 15) * 1000 / rate;
      const startTime = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / estimatedDuration) * 100, 99);
        setProgress(newProgress);
      }, 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      clearProgress();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      clearProgress();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [volume, rate, clearProgress]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      clearProgress();
    }
  }, [isPlaying, isPaused, clearProgress]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      clearProgress();
    }
  }, [clearProgress]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, []);

  const updateRate = useCallback((newRate: number) => {
    setRate(newRate);
  }, []);

  const seekTo = useCallback((percent: number) => {
    // TTS doesn't support seeking, so we restart from approximate position
    if (textRef.current && isPlaying) {
      const charPosition = Math.floor((percent / 100) * textRef.current.length);
      const remainingText = textRef.current.slice(charPosition);
      stop();
      speak(remainingText);
    }
  }, [isPlaying, stop, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearProgress();
    };
  }, [clearProgress]);

  return {
    isPlaying,
    isPaused,
    progress,
    volume,
    rate,
    speak,
    pause,
    resume,
    stop,
    updateVolume,
    updateRate,
    seekTo,
  };
}
