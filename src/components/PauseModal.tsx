import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
}) => {
  const [sfxMuted, setSfxMuted] = React.useState(soundEngine.isMuted().sfx);
  const [musicMuted, setMusicMuted] = React.useState(soundEngine.isMuted().music);

  const toggleSfx = () => {
    soundEngine.playClick();
    const muted = soundEngine.toggleSfxMute();
    setSfxMuted(muted);
  };

  const toggleMusic = () => {
    soundEngine.playClick();
    const muted = soundEngine.toggleMusicMute();
    setMusicMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl flex flex-col items-center">
        <h2 className="text-3xl font-black font-display text-white tracking-wide mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Take a breath before resuming your slice spree
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            Resume
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            Restart
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Main Menu
          </button>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800 w-full justify-center">
          <button
            onClick={toggleSfx}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              sfxMuted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            SFX
          </button>

          <button
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              musicMuted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {musicMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            Music
          </button>
        </div>
      </div>
    </div>
  );
};
