import React from 'react';
import { GameMode } from '../types/game';
import { Pause, RotateCcw, Heart, Clock, Zap } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface GameHUDProps {
  score: number;
  fruitsSliced: number;
  maxCombo: number;
  lives: number;
  timeLeft: number;
  gameMode: GameMode;
  onPause: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  fruitsSliced,
  maxCombo,
  lives,
  timeLeft,
  gameMode,
  onPause,
  onRestart,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 p-4 md:p-6 pointer-events-none flex flex-col gap-2 z-10">
      <div className="flex items-center justify-between gap-4">
        {/* Score & Combo */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black font-display tracking-tight text-white tabular-nums drop-shadow-[0_0_16px_rgba(6,182,212,0.6)]">
                {score}
              </span>
              {maxCombo >= 3 && (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Max {maxCombo}x
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex flex-col pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span>Sliced</span>
            <span className="text-lg font-bold text-slate-200 tabular-nums">
              {fruitsSliced}
            </span>
          </div>
        </div>

        {/* Center: Lives or Timer depending on Mode */}
        <div className="flex items-center gap-2">
          {gameMode === 'classic' && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg">
              {[1, 2, 3].map((heartIndex) => {
                const isAlive = heartIndex <= lives;
                return (
                  <Heart
                    key={heartIndex}
                    className={`w-6 h-6 transition-all duration-300 ${
                      isAlive
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)] scale-100'
                        : 'text-slate-700 fill-transparent scale-90'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {(gameMode === 'arcade' || gameMode === 'zen') && (
            <div
              className={`flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-lg border shadow-lg ${
                timeLeft <= 10 && gameMode === 'arcade'
                  ? 'border-rose-500/80 text-rose-400 animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  : 'border-slate-800 text-cyan-400'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-display font-bold text-2xl tracking-wider tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            title="Restart Game"
            className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onPause();
            }}
            title="Pause Game"
            className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md transition-all active:scale-95"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
