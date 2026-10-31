import React from 'react';
import { GameMode } from '../types/game';
import { BLADE_SKINS } from '../utils/constants';
import { soundEngine } from '../services/soundEngine';
import {
  Trophy,
  Sliders,
  Play,
  Flame,
  ShieldAlert,
  Sparkles,
  Gamepad2,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface StartScreenProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  selectedBladeId: string;
  onSelectBlade: (id: string) => void;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  highScores: { classic: number; arcade: number; zen: number };
}

export const StartScreen: React.FC<StartScreenProps> = ({
  selectedMode,
  onSelectMode,
  selectedBladeId,
  onSelectBlade,
  onStartGame,
  onOpenLeaderboard,
  onOpenSettings,
  highScores,
}) => {
  const modes: {
    id: GameMode;
    title: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      id: 'classic',
      title: 'Classic Dojo',
      tagline: '3 Lives · Missed fruits drop hearts · Fatal Bombs',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/50 hover:border-rose-500',
      badge: 'High: ' + highScores.classic,
    },
    {
      id: 'arcade',
      title: 'Arcade Blitz',
      tagline: '60s Countdown · Combos & Fever · Bombs deduct 15 pts',
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/50 hover:border-amber-500',
      badge: 'High: ' + highScores.arcade,
    },
    {
      id: 'zen',
      title: 'Zen Meditation',
      tagline: '90s Relaxing Flow · Zero Bombs · Pure Slicing',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/50 hover:border-cyan-500',
      badge: 'High: ' + highScores.zen,
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-display font-extrabold text-xl tracking-wider text-white">
            NEON<span className="text-cyan-400">BLADE</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold transition-all active:scale-95"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold transition-all active:scale-95"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Hero Brand & Mode Selection Center */}
      <div className="w-full max-w-2xl my-auto py-6 flex flex-col items-center text-center">
        {/* Glow Title */}
        <div className="relative mb-6">
          <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight text-white drop-shadow-[0_0_35px_rgba(6,182,212,0.65)]">
            NEON <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-rose-400">BLADE</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 font-medium tracking-wide">
            Swipe fast · Slice juicy neon fruits · Dodge plasma bombs
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {modes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectMode(mode.id);
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? `bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]`
                    : `bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900/90 hover:border-slate-700`
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                    {mode.icon}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {mode.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {mode.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Blade Trail Customizer */}
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">
              Blade Energy Trail
            </span>
            <span className="text-cyan-400 font-medium">
              {BLADE_SKINS.find((b) => b.id === selectedBladeId)?.name}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            {BLADE_SKINS.map((blade) => {
              const isSelected = selectedBladeId === blade.id;
              return (
                <button
                  key={blade.id}
                  onClick={() => {
                    soundEngine.playClick();
                    onSelectBlade(blade.id);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: blade.glowColor,
                    boxShadow: `0 0 10px ${blade.glowColor}`,
                  }}
                  title={blade.name}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Large Primary Action Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onStartGame();
          }}
          className="w-full sm:w-72 py-4 px-8 rounded-xl font-display font-black text-xl tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 transition-all shadow-[0_0_28px_rgba(6,182,212,0.7)] hover:shadow-[0_0_40px_rgba(6,182,212,0.9)] active:scale-95 flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-current" />
          START GAME
        </button>
      </div>

      {/* Quick Controls Tip Footer */}
      <div className="text-xs text-slate-500 font-medium text-center">
        Swipe with mouse or finger gestures · Slice multiple fruits in one stroke for bonus combos!
      </div>
    </div>
  );
};
