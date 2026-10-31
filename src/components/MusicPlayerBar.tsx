import React, { useEffect, useState, useRef } from 'react';
import { DEMO_TRACKS, soundEngine } from '../services/soundEngine';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  Disc3,
} from 'lucide-react';

export const MusicPlayerBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.6);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([12, 24, 18, 30, 22, 14, 28, 16]);

  const animFrameRef = useRef<number | null>(null);

  const currentTrack = DEMO_TRACKS[currentTrackIndex];

  // Visualizer bar animation loop
  useEffect(() => {
    let active = true;

    const updateBars = () => {
      if (!active) return;

      if (isPlaying && !isMuted) {
        const freqData = soundEngine.getVisualizerData();
        const bars: number[] = [];
        const count = 8;
        const step = Math.max(1, Math.floor(freqData.length / count));

        for (let i = 0; i < count; i++) {
          const val = freqData[i * step] || 0;
          // Scale 0-255 to height 4px - 28px
          const barHeight = Math.max(4, Math.round((val / 255) * 26));
          bars.push(barHeight);
        }
        setVisualizerBars(bars);
      } else {
        setVisualizerBars([4, 4, 4, 4, 4, 4, 4, 4]);
      }

      animFrameRef.current = requestAnimationFrame(updateBars);
    };

    animFrameRef.current = requestAnimationFrame(updateBars);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isMuted]);

  const handleTogglePlay = () => {
    soundEngine.playClick();
    if (isPlaying) {
      soundEngine.pauseMusic();
      setIsPlaying(false);
    } else {
      soundEngine.startMusic();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    soundEngine.playClick();
    const newIdx = soundEngine.nextTrack();
    setCurrentTrackIndex(newIdx);
    if (!isPlaying) {
      soundEngine.startMusic();
      setIsPlaying(true);
    }
  };

  const handlePrevTrack = () => {
    soundEngine.playClick();
    const newIdx = soundEngine.prevTrack();
    setCurrentTrackIndex(newIdx);
    if (!isPlaying) {
      soundEngine.startMusic();
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    soundEngine.playClick();
    const muted = soundEngine.toggleMusicMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setMusicVolume(val);
    if (isMuted && val > 0) {
      soundEngine.toggleMusicMute();
      setIsMuted(false);
    }
  };

  const handleSelectTrack = (idx: number) => {
    soundEngine.playClick();
    soundEngine.selectTrack(idx);
    setCurrentTrackIndex(idx);
    if (!isPlaying) {
      soundEngine.startMusic();
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-slate-200 select-none z-20">
      {/* Left: Track Information & Visualizer */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div
          className={`p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-cyan-400 ${
            isPlaying ? 'shadow-[0_0_12px_rgba(6,182,212,0.4)]' : ''
          }`}
        >
          <Disc3 className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              Track {currentTrackIndex + 1}/{DEMO_TRACKS.length}
            </span>
            <span className="text-[11px] text-slate-400">· {currentTrack.bpm} BPM</span>
          </div>
          <span className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
            {currentTrack.title}
          </span>
          <span className="text-[11px] text-slate-400 truncate max-w-[200px] hidden sm:inline">
            {currentTrack.style}
          </span>
        </div>

        {/* Live Audio Spectrum Visualizer Bars */}
        <div className="hidden md:flex items-end gap-1 h-7 px-2">
          {visualizerBars.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-t bg-cyan-400 transition-all duration-75"
              style={{
                height: `${height}px`,
                boxShadow: isPlaying ? '0 0 6px rgba(6,182,212,0.8)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Middle: Playback Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 mx-auto">
        <button
          onClick={handlePrevTrack}
          title="Previous Track"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pause Music' : 'Play Music'}
          className={`p-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center ${
            isPlaying
              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]'
              : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={handleNextTrack}
          title="Skip to Next Track"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Track Quick Selector Buttons */}
        <div className="hidden lg:flex items-center gap-1 ml-2 p-1 bg-slate-950/70 rounded-lg border border-slate-800">
          {DEMO_TRACKS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => handleSelectTrack(idx)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                currentTrackIndex === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              0{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Volume & Mute Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-300" />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 sm:w-24 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          title="Music Volume"
        />
      </div>
    </div>
  );
};
