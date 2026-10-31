import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BladeSkin,
  FloatingText,
  FruitEntity,
  FruitId,
  GameMode,
  GameState,
  JuiceSplatter,
  Particle,
  SlashPoint,
} from '../types/game';
import { BLADE_SKINS, FRUIT_CONFIGS } from '../utils/constants';
import { renderSlicedHalf, renderWholeFruit } from '../utils/fruitRenderer';
import { soundEngine } from '../services/soundEngine';

interface FruitNinjaCanvasProps {
  gameState: GameState;
  gameMode: GameMode;
  bladeSkinId: string;
  onScoreUpdate: (score: number, fruitsSliced: number, maxCombo: number) => void;
  onLivesUpdate: (lives: number) => void;
  onTimeUpdate: (timeLeft: number) => void;
  onGameOver: (finalStats: {
    score: number;
    fruitsSliced: number;
    maxCombo: number;
    reason: string;
  }) => void;
  onPause: () => void;
}

export const FruitNinjaCanvas: React.FC<FruitNinjaCanvasProps> = ({
  gameState,
  gameMode,
  bladeSkinId,
  onScoreUpdate,
  onLivesUpdate,
  onTimeUpdate,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Blade Skin
  const currentBlade =
    BLADE_SKINS.find((b) => b.id === bladeSkinId) || BLADE_SKINS[0];

  // Game internal state refs (for 60fps mutable physics loop)
  const scoreRef = useRef<number>(0);
  const fruitsSlicedRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const timeLeftRef = useRef<number>(gameMode === 'arcade' ? 60 : gameMode === 'zen' ? 90 : 0);
  const isGameOverTriggered = useRef<boolean>(false);

  // Entities
  const fruitsRef = useRef<FruitEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splattersRef = useRef<JuiceSplatter[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const slashTrailsRef = useRef<Map<number, SlashPoint[]>>(new Map()); // PointerId -> Points

  // Combo tracking
  const currentSwipeFruitsRef = useRef<{ id: string; time: number }[]>([]);
  const lastSliceTimeRef = useRef<number>(0);

  // Spawn timing
  const lastSpawnTimeRef = useRef<number>(0);
  const nextSpawnIntervalRef = useRef<number>(1.4);

  // Screen shake & flash
  const screenShakeRef = useRef<number>(0);
  const screenFlashRef = useRef<{ color: string; alpha: number } | null>(null);

  // Timer interval ref
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize/Reset game variables when entering PLAYING
  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    fruitsSlicedRef.current = 0;
    maxComboRef.current = 0;
    livesRef.current = 3;
    timeLeftRef.current = gameMode === 'arcade' ? 60 : gameMode === 'zen' ? 90 : 0;
    isGameOverTriggered.current = false;

    fruitsRef.current = [];
    particlesRef.current = [];
    splattersRef.current = [];
    floatingTextsRef.current = [];
    slashTrailsRef.current.clear();
    currentSwipeFruitsRef.current = [];

    onScoreUpdate(0, 0, 0);
    onLivesUpdate(3);
    onTimeUpdate(timeLeftRef.current);
  }, [gameMode, onScoreUpdate, onLivesUpdate, onTimeUpdate]);

  // Handle Game Timer (Arcade & Zen countdown)
  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (gameMode === 'arcade' || gameMode === 'zen') {
        timerIntervalRef.current = window.setInterval(() => {
          timeLeftRef.current -= 1;
          onTimeUpdate(Math.max(0, timeLeftRef.current));

          if (timeLeftRef.current <= 0 && !isGameOverTriggered.current) {
            isGameOverTriggered.current = true;
            soundEngine.playGameOver();
            onGameOver({
              score: scoreRef.current,
              fruitsSliced: fruitsSlicedRef.current,
              maxCombo: maxComboRef.current,
              reason: 'Time is up!',
            });
          }
        }, 1000);
      }
    }

    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState, gameMode, onTimeUpdate, onGameOver]);

  // Reset when state shifts to PLAYING
  useEffect(() => {
    if (gameState === 'PLAYING') {
      resetGame();
    }
  }, [gameState, resetGame]);

  // Collision detection helper: Distance from point to line segment
  const distToSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  // Add Juice Splatter to background
  const createSplatter = (x: number, y: number, color: string, radius: number) => {
    const pointsCount = 10 + Math.floor(Math.random() * 6);
    const points: { angle: number; dist: number }[] = [];
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i * Math.PI * 2) / pointsCount + (Math.random() - 0.5) * 0.4;
      const dist = (0.5 + Math.random() * 0.9) * radius;
      points.push({ angle, dist });
    }

    splattersRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      radius,
      color,
      alpha: 0.8,
      decay: 0.003, // Gently fades over ~10-15 seconds
      points,
    });

    // Keep splatter count within reasonable limits
    if (splattersRef.current.length > 25) {
      splattersRef.current.shift();
    }
  };

  // Create Particle Explosions
  const createParticles = (
    x: number,
    y: number,
    primaryColor: string,
    fleshColor: string,
    count = 25
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.4 ? fleshColor : primaryColor,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.22,
      });
    }
  };

  // Slice Fruit Execution
  const sliceFruit = (fruit: FruitEntity, p1: SlashPoint, p2: SlashPoint) => {
    if (fruit.isSliced) return;

    fruit.isSliced = true;
    fruit.sliceTime = Date.now();

    // Slicing angle
    const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    fruit.sliceAngle = sliceAngle;

    if (fruit.config.isBomb) {
      // BOMB SLICED!
      soundEngine.playBombExplosion();
      screenShakeRef.current = 24;
      screenFlashRef.current = { color: '#EF4444', alpha: 0.8 };

      // Particles
      createParticles(fruit.x, fruit.y, '#EF4444', '#F59E0B', 45);

      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: 'BOOM!',
        subtext: gameMode === 'classic' ? 'BOMB SLICED' : '-15 PTS',
        x: fruit.x,
        y: fruit.y - 30,
        color: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.9)',
        alpha: 1,
        scale: 1.5,
        vy: -2,
      });

      if (gameMode === 'classic') {
        if (!isGameOverTriggered.current) {
          isGameOverTriggered.current = true;
          setTimeout(() => {
            onGameOver({
              score: scoreRef.current,
              fruitsSliced: fruitsSlicedRef.current,
              maxCombo: maxComboRef.current,
              reason: 'Sliced a Plasma Bomb!',
            });
          }, 350);
        }
      } else {
        // Arcade / Zen penalty
        scoreRef.current = Math.max(0, scoreRef.current - 15);
        onScoreUpdate(scoreRef.current, fruitsSlicedRef.current, maxComboRef.current);
      }
      return;
    }

    // NORMAL FRUIT SLICED!
    const swipeSpeed = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    soundEngine.playSlice(swipeSpeed / 30);

    // Compute halves physical trajectory
    // Perpendicular angle for separation
    const perpAngle = sliceAngle + Math.PI / 2;
    const pushSpeed = 3.5 + Math.random() * 2.5;

    fruit.half1 = {
      x: fruit.x,
      y: fruit.y,
      vx: fruit.vx * 0.6 + Math.cos(perpAngle) * pushSpeed,
      vy: fruit.vy * 0.6 + Math.sin(perpAngle) * pushSpeed,
      rotation: fruit.rotation,
      rotationSpeed: -0.08 - Math.random() * 0.08,
    };

    fruit.half2 = {
      x: fruit.x,
      y: fruit.y,
      vx: fruit.vx * 0.6 - Math.cos(perpAngle) * pushSpeed,
      vy: fruit.vy * 0.6 - Math.sin(perpAngle) * pushSpeed,
      rotation: fruit.rotation,
      rotationSpeed: 0.08 + Math.random() * 0.08,
    };

    // Particles & Splatters
    createParticles(fruit.x, fruit.y, fruit.config.primaryColor, fruit.config.fleshColor, 26);
    createSplatter(fruit.x, fruit.y, fruit.config.fleshColor, fruit.radius * 1.2);

    // Score update
    fruitsSlicedRef.current += 1;
    scoreRef.current += fruit.config.points;

    // Combo system
    const now = Date.now();
    if (now - lastSliceTimeRef.current < 320) {
      currentSwipeFruitsRef.current.push({ id: fruit.id, time: now });
    } else {
      currentSwipeFruitsRef.current = [{ id: fruit.id, time: now }];
    }
    lastSliceTimeRef.current = now;

    const currentCombo = currentSwipeFruitsRef.current.length;
    if (currentCombo > maxComboRef.current) {
      maxComboRef.current = currentCombo;
    }

    if (currentCombo >= 3) {
      const comboBonus = currentCombo * 2;
      scoreRef.current += comboBonus;
      soundEngine.playCombo(currentCombo);

      const comboTitles: Record<number, string> = {
        3: 'TRIPLE COMBO!',
        4: 'BLITZ CUT!',
        5: 'CYBER SLICER!',
        6: 'GODLIKE COMBO!',
      };

      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: comboTitles[Math.min(currentCombo, 6)] || `${currentCombo}x MEGA COMBO!`,
        subtext: `+${comboBonus} BONUS`,
        x: fruit.x,
        y: fruit.y - 40,
        color: '#FACC15',
        glowColor: 'rgba(250, 204, 21, 0.8)',
        alpha: 1,
        scale: 1.3,
        vy: -1.8,
      });

      screenShakeRef.current = Math.min(12, currentCombo * 2.5);
    } else {
      // Simple score popup
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: `+${fruit.config.points}`,
        x: fruit.x,
        y: fruit.y - 20,
        color: fruit.config.fleshColor,
        glowColor: fruit.config.glowColor,
        alpha: 1,
        scale: 1,
        vy: -1.2,
      });
    }

    onScoreUpdate(scoreRef.current, fruitsSlicedRef.current, maxComboRef.current);
  };

  // Spawn Fruit logic
  const spawnFruits = (width: number, height: number) => {
    // Determine how many fruits to toss based on difficulty
    const elapsedScore = scoreRef.current;
    let count = 1;
    if (elapsedScore > 20 && Math.random() > 0.45) count = 2;
    if (elapsedScore > 50 && Math.random() > 0.5) count = 3;
    if (elapsedScore > 100 && Math.random() > 0.6) count = 4;

    const availableFruits: FruitId[] = [
      'watermelon',
      'orange',
      'strawberry',
      'pineapple',
      'apple',
      'banana',
      'kiwi',
      'dragonfruit',
    ];

    // Bomb chance
    const canSpawnBomb = gameMode !== 'zen';
    const bombChance = gameMode === 'classic' ? 0.22 : 0.28;

    for (let i = 0; i < count; i++) {
      const isBomb = canSpawnBomb && Math.random() < bombChance && i === 0;
      const fruitId: FruitId = isBomb
        ? 'bomb'
        : availableFruits[Math.floor(Math.random() * availableFruits.length)];

      const config = FRUIT_CONFIGS[fruitId];
      // Random X along bottom with margin
      const margin = width * 0.15;
      const startX = margin + Math.random() * (width - margin * 2);
      const startY = height + 40;

      // Arc launch physics towards canvas center
      const targetX = width * 0.3 + Math.random() * width * 0.4;
      const vx = (targetX - startX) * (0.015 + Math.random() * 0.01);

      // Launch velocity adjusted by canvas height
      const launchPower = Math.sqrt(height) * (0.55 + Math.random() * 0.15);
      const vy = -launchPower;

      fruitsRef.current.push({
        id: Math.random().toString(),
        config,
        x: startX,
        y: startY,
        vx,
        vy,
        radius: config.radius,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        isSliced: false,
        createdAt: Date.now(),
      });
    }

    // Set next spawn interval (gradually speeds up)
    const baseInterval = gameMode === 'zen' ? 1.4 : 1.3;
    const minInterval = 0.7;
    const progressFactor = Math.min(scoreRef.current / 150, 1);
    nextSpawnIntervalRef.current = baseInterval - progressFactor * (baseInterval - minInterval);
  };

  // Main Canvas Animation and Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const nowSec = currentTime / 1000;

      const width = canvas.width;
      const height = canvas.height;

      // Screen shake calculation
      let offsetX = 0;
      let offsetY = 0;
      if (screenShakeRef.current > 0) {
        offsetX = (Math.random() - 0.5) * screenShakeRef.current;
        offsetY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 45);
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // 1. Draw Deep Cyber Dark Canvas Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#090D16');
      bgGrad.addColorStop(0.6, '#04070E');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cyber Grid Lines on the floor
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Permanent / Fading Juice Splatters on Dojo wall
      for (let i = splattersRef.current.length - 1; i >= 0; i--) {
        const splat = splattersRef.current[i];
        splat.alpha -= splat.decay * dt * 60;
        if (splat.alpha <= 0) {
          splattersRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(splat.x, splat.y);
        ctx.beginPath();
        splat.points.forEach((pt, pIdx) => {
          const px = Math.cos(pt.angle) * pt.dist;
          const py = Math.sin(pt.angle) * pt.dist;
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = splat.color;
        ctx.globalAlpha = splat.alpha * 0.55;
        ctx.fill();
        ctx.restore();
      }

      // 3. Spawning & Physics update (Only when PLAYING)
      if (gameState === 'PLAYING') {
        const nowMs = Date.now();
        if ((nowMs - lastSpawnTimeRef.current) / 1000 >= nextSpawnIntervalRef.current) {
          spawnFruits(width, height);
          lastSpawnTimeRef.current = nowMs;
        }

        // Fruit physics & slicing check
        const gravity = 0.38;

        for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
          const fruit = fruitsRef.current[i];

          if (!fruit.isSliced) {
            // Whole fruit in flight
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;
            fruit.vy += gravity;
            fruit.rotation += fruit.rotationSpeed;

            // Render whole fruit
            renderWholeFruit(ctx, fruit, nowSec);

            // Check if dropped below screen
            if (fruit.y > height + 80 && fruit.vy > 0) {
              fruitsRef.current.splice(i, 1);

              // In Classic mode: missed unsliced fruit causes heart loss!
              if (gameMode === 'classic' && !fruit.config.isBomb) {
                livesRef.current -= 1;
                onLivesUpdate(livesRef.current);
                soundEngine.playHeartLost();

                // Drop red X indicator
                floatingTextsRef.current.push({
                  id: Math.random().toString(),
                  text: '✕ MISSED',
                  x: Math.max(60, Math.min(width - 60, fruit.x)),
                  y: height - 60,
                  color: '#EF4444',
                  glowColor: 'rgba(239, 68, 68, 0.8)',
                  alpha: 1,
                  scale: 1,
                  vy: -1.5,
                });

                if (livesRef.current <= 0 && !isGameOverTriggered.current) {
                  isGameOverTriggered.current = true;
                  soundEngine.playGameOver();
                  onGameOver({
                    score: scoreRef.current,
                    fruitsSliced: fruitsSlicedRef.current,
                    maxCombo: maxComboRef.current,
                    reason: 'Lost all 3 lives!',
                  });
                }
              }
            }
          } else {
            // Sliced fruit halves physics
            if (fruit.half1 && fruit.half2) {
              fruit.half1.x += fruit.half1.vx;
              fruit.half1.y += fruit.half1.vy;
              fruit.half1.vy += gravity * 1.1;
              fruit.half1.rotation += fruit.half1.rotationSpeed;

              fruit.half2.x += fruit.half2.vx;
              fruit.half2.y += fruit.half2.vy;
              fruit.half2.vy += gravity * 1.1;
              fruit.half2.rotation += fruit.half2.rotationSpeed;

              // Render both halves
              renderSlicedHalf(ctx, fruit, fruit.half1, 0, nowSec);
              renderSlicedHalf(ctx, fruit, fruit.half2, 1, nowSec);

              // Remove when both halves fall off bottom
              if (fruit.half1.y > height + 100 && fruit.half2.y > height + 100) {
                fruitsRef.current.splice(i, 1);
              }
            }
          }
        }
      }

      // 4. Update & Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * p.alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Glowing Neon Blade Slash Trails
      const nowMs = Date.now();
      const trailLifetime = 160; // ms

      slashTrailsRef.current.forEach((points) => {
        // Prune old points
        while (points.length > 0 && nowMs - points[0].time > trailLifetime) {
          points.shift();
        }

        if (points.length < 2) return;

        // Outer Neon Glow Pass
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = currentBlade.glowColor;
        ctx.shadowBlur = 18;

        for (let i = 1; i < points.length; i++) {
          const pPrev = points[i - 1];
          const pCurr = points[i];
          const ageFactor = 1 - (nowMs - pCurr.time) / trailLifetime;
          const widthVal = Math.max(2, ageFactor * 14);

          ctx.beginPath();
          ctx.moveTo(pPrev.x, pPrev.y);
          ctx.lineTo(pCurr.x, pCurr.y);
          ctx.strokeStyle = currentBlade.trailColor;
          ctx.lineWidth = widthVal;
          ctx.stroke();
        }
        ctx.restore();

        // Inner Sharp Laser Core Pass
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < points.length; i++) {
          const pPrev = points[i - 1];
          const pCurr = points[i];
          const ageFactor = 1 - (nowMs - pCurr.time) / trailLifetime;
          const widthVal = Math.max(1, ageFactor * 5);

          ctx.beginPath();
          ctx.moveTo(pPrev.x, pPrev.y);
          ctx.lineTo(pCurr.x, pCurr.y);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = widthVal;
          ctx.stroke();
        }
        ctx.restore();
      });

      // 6. Draw Floating Texts (Scores & Combos)
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.textAlign = 'center';
        ctx.shadowColor = ft.glowColor;
        ctx.shadowBlur = 12;

        ctx.font = `bold ${Math.round(22 * ft.scale)}px Outfit, sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);

        if (ft.subtext) {
          ctx.font = `600 ${Math.round(13 * ft.scale)}px Outfit, sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(ft.subtext, ft.x, ft.y + 18 * ft.scale);
        }
        ctx.restore();
      }

      // 7. Screen Red Flash on Bomb
      if (screenFlashRef.current) {
        ctx.fillStyle = screenFlashRef.current.color;
        ctx.globalAlpha = screenFlashRef.current.alpha;
        ctx.fillRect(0, 0, width, height);

        screenFlashRef.current.alpha -= dt * 2.5;
        if (screenFlashRef.current.alpha <= 0) {
          screenFlashRef.current = null;
        }
      }

      ctx.restore(); // Restore shake

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, gameMode, currentBlade, onLivesUpdate, onGameOver, onScoreUpdate]);

  // Handle Resize & High-DPI Canvas Setup
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer Movement and Slicing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const trail = [{ x, y, time: Date.now() }];
    slashTrailsRef.current.set(e.pointerId, trail);

    soundEngine.playSwoosh();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const trail = slashTrailsRef.current.get(e.pointerId);
    if (!trail) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = Date.now();

    const newPoint = { x, y, time: now };
    const prevPoint = trail[trail.length - 1];

    trail.push(newPoint);

    // Limit trail memory per stroke
    if (trail.length > 25) {
      trail.shift();
    }

    // Play swish on fast mouse/swipe drag
    if (prevPoint) {
      const dist = Math.hypot(x - prevPoint.x, y - prevPoint.y);
      if (dist > 35 && Math.random() > 0.6) {
        soundEngine.playSwoosh();
      }

      // Check collision between segment (prevPoint -> newPoint) and all active fruits
      if (gameState === 'PLAYING') {
        fruitsRef.current.forEach((fruit) => {
          if (!fruit.isSliced) {
            const dist = distToSegment(
              fruit.x,
              fruit.y,
              prevPoint.x,
              prevPoint.y,
              newPoint.x,
              newPoint.y
            );
            if (dist <= fruit.radius) {
              sliceFruit(fruit, prevPoint, newPoint);
            }
          }
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    slashTrailsRef.current.delete(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    slashTrailsRef.current.delete(e.pointerId);
  };

  return (
    <div className="relative w-full h-full select-none touch-none overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
};
