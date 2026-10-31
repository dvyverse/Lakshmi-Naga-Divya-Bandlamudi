import { FruitEntity, FruitId } from '../types/game';

/**
 * Draws a whole fruit with procedural detailing, specular shines, rinds, and seeds.
 */
export function renderWholeFruit(
  ctx: CanvasRenderingContext2D,
  fruit: FruitEntity,
  nowSec: number
) {
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rotation);

  // Subtle ambient glow
  ctx.shadowColor = fruit.config.glowColor;
  ctx.shadowBlur = fruit.config.isBomb ? 18 : 10;

  drawFruitGeometry(ctx, fruit.config.id, fruit.radius, nowSec);

  ctx.restore();
}

/**
 * Draws a sliced half of a fruit using canvas clipping along the slice angle.
 * halfType: -1 (top half) or 1 (bottom half)
 */
export function renderSlicedHalf(
  ctx: CanvasRenderingContext2D,
  fruit: FruitEntity,
  halfData: { x: number; y: number; rotation: number },
  halfIndex: 0 | 1,
  nowSec: number
) {
  ctx.save();
  ctx.translate(halfData.x, halfData.y);
  ctx.rotate(halfData.rotation);

  const r = fruit.radius;

  // Clip half plane
  ctx.save();
  ctx.beginPath();
  if (halfIndex === 0) {
    // Upper semi-circle
    ctx.arc(0, 0, r, Math.PI, 0, false);
  } else {
    // Lower semi-circle
    ctx.arc(0, 0, r, 0, Math.PI, false);
  }
  ctx.closePath();
  ctx.clip();

  // Draw full fruit body inside clip
  drawFruitGeometry(ctx, fruit.config.id, r, nowSec);
  ctx.restore();

  // Draw exposed flat cut cross-section along the cut line
  drawCrossSection(ctx, fruit.config.id, r, halfIndex);

  ctx.restore();
}

function drawFruitGeometry(
  ctx: CanvasRenderingContext2D,
  id: FruitId,
  r: number,
  nowSec: number
) {
  switch (id) {
    case 'watermelon':
      drawWatermelon(ctx, r);
      break;
    case 'orange':
      drawOrange(ctx, r);
      break;
    case 'strawberry':
      drawStrawberry(ctx, r);
      break;
    case 'pineapple':
      drawPineapple(ctx, r);
      break;
    case 'apple':
      drawApple(ctx, r);
      break;
    case 'banana':
      drawBanana(ctx, r);
      break;
    case 'kiwi':
      drawKiwi(ctx, r);
      break;
    case 'dragonfruit':
      drawDragonfruit(ctx, r);
      break;
    case 'bomb':
      drawBomb(ctx, r, nowSec);
      break;
  }
}

// --- Specific Fruit Geometry ---

function drawWatermelon(ctx: CanvasRenderingContext2D, r: number) {
  // Dark Green Rind base
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#10B981');
  grad.addColorStop(0.8, '#059669');
  grad.addColorStop(1, '#064E3B');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Dark jagged stripes
  ctx.strokeStyle = '#022C22';
  ctx.lineWidth = r * 0.12;
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    const xOffset = (i / 4) * r * 0.8;
    ctx.beginPath();
    ctx.moveTo(xOffset - r * 0.1, -r * 0.9);
    ctx.quadraticCurveTo(xOffset + r * 0.15, 0, xOffset - r * 0.1, r * 0.9);
    ctx.stroke();
  }

  // Specular shine
  drawHighlight(ctx, -r * 0.35, -r * 0.35, r * 0.4);
}

function drawOrange(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#FB923C');
  grad.addColorStop(0.7, '#F97316');
  grad.addColorStop(1, '#C2410C');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Dimple peel texture
  ctx.fillStyle = 'rgba(194, 65, 12, 0.25)';
  for (let i = 0; i < 20; i++) {
    const angle = (i * 137.5 * Math.PI) / 180;
    const dist = (Math.sqrt(i) / Math.sqrt(20)) * r * 0.8;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stem indentation
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#4D7C0F';
  ctx.fill();

  drawHighlight(ctx, -r * 0.35, -r * 0.35, r * 0.35);
}

function drawStrawberry(ctx: CanvasRenderingContext2D, r: number) {
  // Berry teardrop/heart shape
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(r * 1.1, r * 0.4, r * 1.0, -r * 0.8, 0, -r * 0.7);
  ctx.bezierCurveTo(-r * 1.0, -r * 0.8, -r * 1.1, r * 0.4, 0, r);
  ctx.closePath();

  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 5, 0, 0, r);
  grad.addColorStop(0, '#FB7185');
  grad.addColorStop(0.6, '#E11D48');
  grad.addColorStop(1, '#9F1239');
  ctx.fillStyle = grad;
  ctx.fill();

  // Tiny yellow seed dots
  ctx.fillStyle = '#FEF08A';
  for (let row = -3; row <= 3; row++) {
    const cols = 5 - Math.abs(row);
    for (let col = -cols / 2; col <= cols / 2; col++) {
      ctx.beginPath();
      ctx.ellipse(col * (r * 0.35), row * (r * 0.22), 1.2, 2.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Green calyx leaves
  ctx.fillStyle = '#15803D';
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(Math.cos(angle) * r * 0.6, -r * 0.7 + Math.sin(angle) * r * 0.3);
    ctx.lineTo(Math.cos(angle + 0.3) * r * 0.2, -r * 0.7);
    ctx.fill();
  }

  drawHighlight(ctx, -r * 0.3, -r * 0.2, r * 0.3);
}

function drawPineapple(ctx: CanvasRenderingContext2D, r: number) {
  // Oval body
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.8, r * 0.9, 0, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#EAB308');
  grad.addColorStop(0.5, '#CA8A04');
  grad.addColorStop(1, '#854D0E');
  ctx.fillStyle = grad;
  ctx.fill();

  // Diamond skin texture
  ctx.strokeStyle = '#713F12';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, i * r * 0.35);
    ctx.lineTo(r * 0.7, (i + 1) * r * 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.7, i * r * 0.35);
    ctx.lineTo(-r * 0.7, (i + 1) * r * 0.35);
    ctx.stroke();
  }

  // Spiky crown leaves on top
  ctx.fillStyle = '#15803D';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.quadraticCurveTo(i * r * 0.25, -r * 1.3, i * r * 0.45, -r * 1.4);
    ctx.quadraticCurveTo(i * r * 0.15, -r * 0.9, 0, -r * 0.6);
    ctx.fill();
  }
}

function drawApple(ctx: CanvasRenderingContext2D, r: number) {
  // Apple heart-like curvature
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.bezierCurveTo(r * 0.6, -r * 1.0, r * 1.1, -r * 0.3, r * 0.9, r * 0.5);
  ctx.bezierCurveTo(r * 0.7, r * 1.0, r * 0.2, r * 0.9, 0, r * 0.8);
  ctx.bezierCurveTo(-r * 0.2, r * 0.9, -r * 0.7, r * 1.0, -r * 0.9, r * 0.5);
  ctx.bezierCurveTo(-r * 1.1, -r * 0.3, -r * 0.6, -r * 1.0, 0, -r * 0.7);
  ctx.closePath();

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 5, 0, 0, r);
  grad.addColorStop(0, '#A3E635');
  grad.addColorStop(0.7, '#65A30D');
  grad.addColorStop(1, '#3F6212');
  ctx.fillStyle = grad;
  ctx.fill();

  // Stem
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.2, -r * 1.1, r * 0.15, -r * 1.15);
  ctx.stroke();

  // Small leaf
  ctx.fillStyle = '#4D7C0F';
  ctx.beginPath();
  ctx.ellipse(r * 0.25, -r * 0.95, r * 0.25, r * 0.12, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  drawHighlight(ctx, -r * 0.35, -r * 0.35, r * 0.35);
}

function drawBanana(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  // Curved crescent
  ctx.arc(0, r * 0.8, r * 1.4, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.arc(0, r * 0.5, r * 1.1, -Math.PI * 0.25, -Math.PI * 0.75, true);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-r, 0, r, 0);
  grad.addColorStop(0, '#65A30D');
  grad.addColorStop(0.2, '#FACC15');
  grad.addColorStop(0.8, '#EAB308');
  grad.addColorStop(1, '#78350F');
  ctx.fillStyle = grad;
  ctx.fill();

  // Ridges
  ctx.strokeStyle = 'rgba(161, 98, 7, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, r * 0.65, r * 1.25, -Math.PI * 0.73, -Math.PI * 0.27);
  ctx.stroke();
}

function drawKiwi(ctx: CanvasRenderingContext2D, r: number) {
  // Brown fuzzy oval
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 5, 0, 0, r);
  grad.addColorStop(0, '#A16207');
  grad.addColorStop(0.8, '#78350F');
  grad.addColorStop(1, '#451A03');
  ctx.fillStyle = grad;
  ctx.fill();

  // Fuzzy hairs
  ctx.strokeStyle = 'rgba(69, 26, 3, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 28; i++) {
    const angle = (i * Math.PI * 2) / 28;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.lineTo(Math.cos(angle) * (r + 3), Math.sin(angle) * (r + 3));
    ctx.stroke();
  }
}

function drawDragonfruit(ctx: CanvasRenderingContext2D, r: number) {
  // Vibrant magenta base
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  grad.addColorStop(0, '#F43F5E');
  grad.addColorStop(0.7, '#E11D48');
  grad.addColorStop(1, '#BE123C');
  ctx.fillStyle = grad;
  ctx.fill();

  // Flame scales with green tips
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7;
    const dist = r * 0.75;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(-r * 0.2, 0);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(r * 0.2, 0);
    ctx.closePath();
    ctx.fillStyle = '#84CC16';
    ctx.fill();
    ctx.restore();
  }
}

function drawBomb(ctx: CanvasRenderingContext2D, r: number, nowSec: number) {
  // Bomb metallic obsidian sphere
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.5, '#1E293B');
  grad.addColorStop(0.9, '#090D16');
  grad.addColorStop(1, '#020617');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Glowing red hazard ring
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Skull / Hazard symbol
  ctx.fillStyle = '#EF4444';
  ctx.font = `bold ${Math.round(r * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✕', 0, 0);

  // Fuse neck
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-r * 0.15, -r - 4, r * 0.3, 6);

  // Curved rope fuse
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -r - 4);
  ctx.quadraticCurveTo(r * 0.4, -r - 16, r * 0.3, -r - 24);
  ctx.stroke();

  // Animated sparks at the fuse tip!
  const sparkX = r * 0.3;
  const sparkY = -r - 24;

  const sparkPulse = (Math.sin(nowSec * 25) + 1) * 0.5;
  const sparkR = 6 + sparkPulse * 6;

  // Outer orange aura
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkR * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
  ctx.fill();

  // Inner yellow spark
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkR, 0, Math.PI * 2);
  ctx.fillStyle = '#FDE047';
  ctx.fill();

  // White core
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, sparkR * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
}

// --- Exposed Cut Cross-Sections along the Slice Plane ---

function drawCrossSection(
  ctx: CanvasRenderingContext2D,
  id: FruitId,
  r: number,
  halfIndex: 0 | 1
) {
  // Sliced diameter line goes from (-r, 0) to (r, 0)
  ctx.save();
  ctx.lineWidth = 3;

  const sign = halfIndex === 0 ? -1 : 1;

  if (id === 'watermelon') {
    // Red juicy flesh fill
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F43F5E';
    ctx.fill();

    // White/Lime pith band
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.stroke();

    // Black teardrop seeds
    ctx.fillStyle = '#0F172A';
    [-r * 0.6, -r * 0.3, 0, r * 0.3, r * 0.6].forEach((x, i) => {
      const y = sign * (12 + (i % 2) * 8);
      ctx.beginPath();
      ctx.ellipse(x, y, 2.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (id === 'orange') {
    // Orange pulp interior
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#FB923C';
    ctx.fill();

    // Citrus pith wedges
    ctx.strokeStyle = '#FFEDD5';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (r - 4), sign * Math.sin(a) * (r - 4));
      ctx.stroke();
    }

  } else if (id === 'kiwi') {
    // Emerald green flesh
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#4ADE80';
    ctx.fill();

    // Cream center
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(0, sign * 5, r * 0.25, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiny black kiwi seeds
    ctx.fillStyle = '#1E293B';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 11;
      const dist = r * 0.5;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * dist, sign * (Math.sin(a) * dist * 0.5 + 4), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (id === 'dragonfruit') {
    // Pure white flesh with black dots
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();

    // Tiny black seeds
    ctx.fillStyle = '#0F172A';
    for (let i = 0; i < 22; i++) {
      const x = (Math.random() - 0.5) * (r * 1.5);
      const y = sign * (Math.random() * (r * 0.7) + 3);
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Generic crisp flesh
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, halfIndex === 0 ? Math.PI : 0, halfIndex === 0 ? 0 : Math.PI);
    ctx.closePath();
    ctx.fillStyle = id === 'pineapple' ? '#FDE047' : '#FEF3C7';
    ctx.fill();
  }

  // Draw flat cut edge highlight
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.stroke();

  ctx.restore();
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}
