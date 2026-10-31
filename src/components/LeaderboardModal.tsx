import React, { useState } from 'react';
import { GameMode, LeaderboardEntry } from '../types/game';
import { X, Trophy, Medal, Trash2 } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
  onClearLeaderboard: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  onClose,
  onClearLeaderboard,
}) => {
  const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');

  const filteredEntries = entries
    .filter((e) => (filterMode === 'all' ? true : e.mode === filterMode))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                Hall of Champions
              </h2>
              <p className="text-xs text-slate-400">
                Top high scores recorded on this machine
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-800 text-xs">
          {(['all', 'classic', 'arcade', 'zen'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                soundEngine.playClick();
                setFilterMode(mode);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                filterMode === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Entries Table */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No scores recorded for this category yet. Start slicing to claim your rank!
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-800/60">
              {filteredEntries.map((entry, index) => {
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-800/40 rounded-lg transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono font-bold text-slate-400">
                        {index === 0 ? (
                          <span className="text-amber-400 flex items-center justify-center">
                            <Medal className="w-4 h-4" />
                          </span>
                        ) : index === 1 ? (
                          <span className="text-slate-300">2</span>
                        ) : index === 2 ? (
                          <span className="text-amber-700">3</span>
                        ) : (
                          index + 1
                        )}
                      </span>

                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          {entry.playerName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="capitalize">{entry.mode}</span>
                          <span>·</span>
                          <span>{entry.fruitsSliced} sliced</span>
                          <span>·</span>
                          <span>{entry.maxCombo}x combo</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black font-display text-cyan-400 tabular-nums">
                        {entry.score}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        {entry.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={() => {
              soundEngine.playClick();
              if (window.confirm('Reset all saved leaderboard scores?')) {
                onClearLeaderboard();
              }
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
