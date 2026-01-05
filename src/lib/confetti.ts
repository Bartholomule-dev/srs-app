/**
 * Confetti celebration utilities using canvas-confetti
 *
 * Provides themed confetti effects for celebrations:
 * - fireConfetti(): Large burst for session completion
 * - fireConfettiMini(): Small burst for correct answers
 *
 * Colors match the app theme (warm gold palette)
 */
import confetti from 'canvas-confetti';

// Theme colors matching the warm gold app palette
const THEME_COLORS = [
  '#F59E0B', // amber-500 (primary)
  '#F97316', // orange-500 (secondary)
  '#FACC15', // yellow-400
  '#10B981', // green-500 (success)
  '#CA8A04', // yellow-600
];

/**
 * Fire a large confetti burst for celebrations like session completion
 * @param isPerfect - If true, fires an extra large celebratory burst
 */
export function fireConfetti(isPerfect = false): void {
  const particleCount = isPerfect ? 150 : 100;
  const spread = isPerfect ? 80 : 60;

  // Fire main burst from center
  confetti({
    particleCount,
    spread,
    origin: { y: 0.6 },
    colors: THEME_COLORS,
    disableForReducedMotion: true,
  });

  // For perfect scores, add side bursts for extra celebration
  if (isPerfect) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: THEME_COLORS,
        disableForReducedMotion: true,
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: THEME_COLORS,
        disableForReducedMotion: true,
      });
    }, 200);
  }
}

/**
 * Fire a mini confetti burst for correct answers
 * Small, subtle celebration (3-5 particles)
 * @param origin - Optional origin point { x: 0-1, y: 0-1 }
 */
export function fireConfettiMini(origin?: { x: number; y: number }): void {
  confetti({
    particleCount: 5,
    spread: 30,
    startVelocity: 20,
    decay: 0.95,
    scalar: 0.8,
    origin: origin ?? { x: 0.5, y: 0.5 },
    colors: THEME_COLORS.slice(0, 3), // Use amber, orange, yellow for mini
    disableForReducedMotion: true,
  });
}

/**
 * Reset/clear any active confetti animations
 */
export function resetConfetti(): void {
  confetti.reset();
}
