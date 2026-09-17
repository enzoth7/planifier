import confetti from 'canvas-confetti';

/**
 * Fires a vintage luxury celebration confetti with gold, amber, parchment and emerald flakes
 */
export function fireCraftsmanCelebration(originX = 0.5, originY = 0.5) {
  const vintagePalette = [
    '#cca325', // Gold
    '#e5be38', // Bright Brass
    '#f8f5ee', // Ivory
    '#2a725c', // Emerald
    '#b35434', // Terracotta
    '#8e273f', // Burgundy
  ];

  confetti({
    particleCount: 55,
    spread: 60,
    origin: { x: originX, y: originY },
    colors: vintagePalette,
    ticks: 200,
    gravity: 0.8,
    scalar: 0.9,
    shapes: ['square', 'circle'],
    drift: 0,
    disableForReducedMotion: true,
  });
}
