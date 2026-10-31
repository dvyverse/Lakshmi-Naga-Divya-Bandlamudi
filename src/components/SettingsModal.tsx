import React, { useState } from 'react';
import { BLADE_SKINS } from '../utils/constants';
import { soundEngine } from '../services/soundEngine';
import { X, Volume2, VolumeX, Sparkles, Sliders } from 'lucide-react';

interface SettingsModalProps {
  selectedBladeId: string;
  onSelectBlade: (id: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  selectedBladeId,
  onSelectBlade,
  onClose,
}) => {
  const [sfxMuted, setSfxMuted] = useState(soundEngine.isMuted().sfx);
  const [musicMuted, setMusicMuted] = useState(soundEngine.isMuted().music);
  const [sfxVol, setSfxVol] = useState(0.8);
  const [musicVol, setMusicVol] = useState(0.6);

  const handleSfxVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVol(val);
    soundEngine.setSfxVolume(val);
    if (sfxMuted && val > 0) {
      soundEngine.toggleSfxMute();
      setSfxMuted(false);
    }
  };

  const handleMusicVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundEngine.setMusicVolume(val);
    if (musicMuted && val > 0) {
      soundEngine.toggleMusicMute();
      setMusicMuted(false);
    }
  };

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
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                Game Settings
              </h2>
              <p className="text-xs text-slate-400">
                Audio mix, blade trails, and preferences
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Blade Customizer Section */}
        <div className="py-4 border-b border-slate-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
            Neon Blade Skin
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BLADE_SKINS.map((blade) => {
              const isSelected = selectedBladeId === blade.id;
              return (
                <button
                  key={blade.id}
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectBlade(blade.id);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 text-white ring-1 ring-cyan-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      backgroundColor: blade.glowColor,
                      boxShadow: `0 0 8px ${blade.glowColor}`,
                    }}
                  />
                  <span className="truncate">{blade.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Volume Controls */}
        <div className="py-4 flex flex-col gap-4 border-b border-slate-800">
          {/* SFX Volume */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Sound Effects (SFX)</span>
              <button
                onClick={toggleSfx}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxMuted ? 0 : sfxVol}
              onChange={handleSfxVol}
              className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Background Music</span>
              <button
                onClick={toggleMusic}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {musicMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicMuted ? 0 : musicVol}
              onChange={handleMusicVol}
              className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Tips / Shortcuts */}
        <div className="pt-4 text-xs text-slate-400 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Arcade Pro Tip:
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Slice 3 or more fruits in a single swipe to trigger rapid Combo multipliers and earn massive score boosts!
          </p>
        </div>

        <div className="pt-5 mt-2 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all text-xs"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
