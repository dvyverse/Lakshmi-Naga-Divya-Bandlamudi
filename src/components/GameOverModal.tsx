import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { RotateCcw, Home, Trophy, Zap, Slice, Award } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface GameOverModalProps {
  score: number;
  fruitsSliced: number;
  maxCombo: number;
  reason: string;
  gameMode: GameMode;
  isHighScore: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onSaveScore: (playerName: string) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  fruitsSliced,
  maxCombo,
  reason,
  gameMode,
  isHighScore,
  onPlayAgain,
  onHome,
  onSaveScore,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSaved) return;
    soundEngine.playClick();
    onSaveScore(playerName.trim());
    setHasSaved(true);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl flex flex-col items-center">
        {/* Game Over Title & Reason */}
        <div className="mb-4">
          <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
            {reason}
          </span>
          <h2 className="text-4xl font-black font-display text-white tracking-wide mt-1 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
            GAME OVER
          </h2>
        </div>

        {/* High Score Banner */}
        {isHighScore && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold mb-4 animate-bounce">
            <Award className="w-4 h-4 text-amber-400" />
            NEW PERSONAL BEST!
          </div>
        )}

        {/* Big Score Box */}
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-4">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Final Score
          </span>
          <div className="text-5xl font-black font-display text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] my-1 tabular-nums">
            {score}
          </div>
          <span className="text-xs text-slate-400 capitalize">
            Mode: {gameMode}
          </span>
        </div>

        {/* Detailed Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3 text-left">
            <div className="p-2 rounded-md bg-slate-900 text-cyan-400">
              <Slice className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Fruits Sliced</span>
              <span className="text-lg font-bold text-white tabular-nums">{fruitsSliced}</span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3 text-left">
            <div className="p-2 rounded-md bg-slate-900 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Max Combo</span>
              <span className="text-lg font-bold text-white tabular-nums">{maxCombo}x</span>
            </div>
          </div>
        </div>

        {/* Submit to Leaderboard Form */}
        {!hasSaved ? (
          <form onSubmit={handleSave} className="w-full mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter player name..."
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!playerName.trim()}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5" />
                Save Rank
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs text-emerald-400 font-semibold mb-6 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            ✓ Score successfully recorded to Leaderboard!
          </div>
        )}

        {/* Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onHome();
            }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
