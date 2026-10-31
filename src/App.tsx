/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, LeaderboardEntry } from './types/game';
import { INITIAL_LEADERBOARD } from './utils/constants';
import { FruitNinjaCanvas } from './components/FruitNinjaCanvas';
import { GameHUD } from './components/GameHUD';
import { MusicPlayerBar } from './components/MusicPlayerBar';
import { StartScreen } from './components/StartScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './services/soundEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [selectedBladeId, setSelectedBladeId] = useState<string>('cyber-cyan');

  // Live in-game stats
  const [score, setScore] = useState<number>(0);
  const [fruitsSliced, setFruitsSliced] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Game over data
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Persistent High Scores & Leaderboard
  const [highScores, setHighScores] = useState<{ classic: number; arcade: number; zen: number }>(() => {
    try {
      const saved = localStorage.getItem('neon_blade_high_scores');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { classic: 295, arcade: 384, zen: 215 };
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('neon_blade_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_LEADERBOARD;
  });

  // Save leaderboards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('neon_blade_leaderboard', JSON.stringify(leaderboard));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }, [leaderboard]);

  useEffect(() => {
    try {
      localStorage.setItem('neon_blade_high_scores', JSON.stringify(highScores));
    } catch (e) {
      console.warn('Failed to save high scores:', e);
    }
  }, [highScores]);

  // Keyboard shortcut for Pause (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        if (gameState === 'PLAYING') {
          e.preventDefault();
          soundEngine.playClick();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          e.preventDefault();
          soundEngine.playClick();
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start Game
  const handleStartGame = () => {
    setScore(0);
    setFruitsSliced(0);
    setMaxCombo(0);
    setLives(3);
    setTimeLeft(gameMode === 'arcade' ? 60 : gameMode === 'zen' ? 90 : 0);
    setGameState('PLAYING');

    // Auto-start background music if not currently playing
    if (!soundEngine.isPlaying()) {
      soundEngine.startMusic();
    }
  };

  // Score callbacks from canvas
  const handleScoreUpdate = useCallback((newScore: number, newSliced: number, newCombo: number) => {
    setScore(newScore);
    setFruitsSliced(newSliced);
    setMaxCombo(newCombo);
  }, []);

  const handleLivesUpdate = useCallback((newLives: number) => {
    setLives(newLives);
  }, []);

  const handleTimeUpdate = useCallback((newTime: number) => {
    setTimeLeft(newTime);
  }, []);

  // Game Over trigger
  const handleGameOver = useCallback((finalStats: {
    score: number;
    fruitsSliced: number;
    maxCombo: number;
    reason: string;
  }) => {
    setScore(finalStats.score);
    setFruitsSliced(finalStats.fruitsSliced);
    setMaxCombo(finalStats.maxCombo);
    setGameOverReason(finalStats.reason);

    // Check if new personal best for this mode
    const prevBest = highScores[gameMode];
    const isBest = finalStats.score > prevBest;
    setIsNewHighScore(isBest);

    if (isBest) {
      setHighScores((prev) => ({
        ...prev,
        [gameMode]: finalStats.score,
      }));
    }

    setGameState('GAMEOVER');
  }, [gameMode, highScores]);

  // Save score to leaderboard
  const handleSaveScore = (playerName: string) => {
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(),
      playerName,
      score,
      mode: gameMode,
      fruitsSliced,
      maxCombo,
      date: 'Just now',
    };

    setLeaderboard((prev) => [newEntry, ...prev].slice(0, 30));
  };

  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    setHighScores({ classic: 0, arcade: 0, zen: 0 });
    try {
      localStorage.removeItem('neon_blade_leaderboard');
      localStorage.removeItem('neon_blade_high_scores');
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans select-none">
      {/* Central Interactive Slicing Arena */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <FruitNinjaCanvas
          gameState={gameState}
          gameMode={gameMode}
          bladeSkinId={selectedBladeId}
          onScoreUpdate={handleScoreUpdate}
          onLivesUpdate={handleLivesUpdate}
          onTimeUpdate={handleTimeUpdate}
          onGameOver={handleGameOver}
          onPause={() => setGameState('PAUSED')}
        />

        {/* Live In-Game HUD (Visible during PLAYING and PAUSED) */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <GameHUD
            score={score}
            fruitsSliced={fruitsSliced}
            maxCombo={maxCombo}
            lives={lives}
            timeLeft={timeLeft}
            gameMode={gameMode}
            onPause={() => setGameState('PAUSED')}
            onRestart={handleStartGame}
          />
        )}

        {/* Start / Menu Screen */}
        {gameState === 'MENU' && (
          <StartScreen
            selectedMode={gameMode}
            onSelectMode={setGameMode}
            selectedBladeId={selectedBladeId}
            onSelectBlade={setSelectedBladeId}
            onStartGame={handleStartGame}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            highScores={highScores}
          />
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            onResume={() => setGameState('PLAYING')}
            onRestart={handleStartGame}
            onHome={() => setGameState('MENU')}
          />
        )}

        {/* Game Over Summary Modal */}
        {gameState === 'GAMEOVER' && (
          <GameOverModal
            score={score}
            fruitsSliced={fruitsSliced}
            maxCombo={maxCombo}
            reason={gameOverReason}
            gameMode={gameMode}
            isHighScore={isNewHighScore}
            onPlayAgain={handleStartGame}
            onHome={() => setGameState('MENU')}
            onSaveScore={handleSaveScore}
          />
        )}

        {/* Leaderboard Modal */}
        {isLeaderboardOpen && (
          <LeaderboardModal
            entries={leaderboard}
            onClose={() => setIsLeaderboardOpen(false)}
            onClearLeaderboard={handleClearLeaderboard}
          />
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            selectedBladeId={selectedBladeId}
            onSelectBlade={setSelectedBladeId}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </main>

      {/* Docked AI Demo Background Music Player Bar */}
      <footer className="shrink-0 w-full">
        <MusicPlayerBar />
      </footer>
    </div>
  );
}
