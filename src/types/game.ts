export type GameMode = 'classic' | 'arcade' | 'zen';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type FruitId =
  | 'watermelon'
  | 'orange'
  | 'strawberry'
  | 'pineapple'
  | 'apple'
  | 'banana'
  | 'kiwi'
  | 'dragonfruit'
  | 'bomb';

export interface FruitConfig {
  id: FruitId;
  name: string;
  radius: number;
  points: number;
  primaryColor: string;
  fleshColor: string;
  rindColor: string;
  glowColor: string;
  isBomb?: boolean;
}

export interface FruitEntity {
  id: string;
  config: FruitConfig;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  isSliced: boolean;
  sliceAngle?: number;
  // Sliced halves physics
  half1?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
  };
  half2?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
  };
  sliceTime?: number;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
}

export interface JuiceSplatter {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  points: { angle: number; dist: number }[];
}

export interface SlashPoint {
  x: number;
  y: number;
  time: number;
}

export interface FloatingText {
  id: string;
  text: string;
  subtext?: string;
  x: number;
  y: number;
  color: string;
  glowColor: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface BladeSkin {
  id: string;
  name: string;
  coreColor: string;
  glowColor: string;
  trailColor: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  mode: GameMode;
  fruitsSliced: number;
  maxCombo: number;
  date: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  style: string;
  bpm: number;
  description: string;
}
