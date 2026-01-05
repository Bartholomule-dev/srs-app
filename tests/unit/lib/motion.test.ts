import { describe, expect, it } from 'vitest';
import {
  DURATION,
  EASE,
  springConfig,
  fadeIn,
  slideUp,
  slideIn,
  scaleIn,
  staggerContainer,
  staggerItem,
} from '@/lib/motion';

describe('motion constants', () => {
  it('exports duration tiers', () => {
    expect(DURATION.micro).toBe(0.15);
    expect(DURATION.fast).toBe(0.2);
    expect(DURATION.normal).toBe(0.3);
    expect(DURATION.slow).toBe(0.4);
    expect(DURATION.page).toBe(0.5);
  });

  it('exports ease curves', () => {
    expect(EASE.default).toEqual([0.25, 1, 0.5, 1]);
    expect(EASE.emphasized).toEqual([0.2, 0, 0, 1]);
    expect(EASE.decelerate).toEqual([0, 0, 0.2, 1]);
  });

  it('exports spring config for micro-interactions', () => {
    expect(springConfig.stiffness).toBe(400);
    expect(springConfig.damping).toBe(30);
  });

  it('exports fadeIn preset animation', () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 });
    expect(fadeIn.animate).toEqual({ opacity: 1 });
    expect(fadeIn.exit).toEqual({ opacity: 0 });
    expect(fadeIn.transition).toEqual({
      duration: DURATION.fast,
      ease: EASE.default,
    });
  });

  it('exports slideUp preset animation', () => {
    expect(slideUp.initial).toEqual({ opacity: 0, y: 20 });
    expect(slideUp.animate).toEqual({ opacity: 1, y: 0 });
    expect(slideUp.exit).toEqual({ opacity: 0, y: -10 });
    expect(slideUp.transition).toEqual({
      duration: DURATION.normal,
      ease: EASE.default,
    });
  });

  it('exports slideIn preset animation', () => {
    expect(slideIn.initial).toEqual({ opacity: 0, x: -10 });
    expect(slideIn.animate).toEqual({ opacity: 1, x: 0 });
    expect(slideIn.exit).toEqual({ opacity: 0, x: 10 });
    expect(slideIn.transition).toEqual({
      duration: DURATION.fast,
      ease: EASE.default,
    });
  });

  it('exports scaleIn preset animation', () => {
    expect(scaleIn.initial).toEqual({ opacity: 0, scale: 0.95 });
    expect(scaleIn.animate).toEqual({ opacity: 1, scale: 1 });
    expect(scaleIn.exit).toEqual({ opacity: 0, scale: 0.95 });
    expect(scaleIn.transition).toEqual({
      duration: DURATION.normal,
      ease: EASE.default,
    });
  });

  it('exports staggerContainer for staggered animations', () => {
    expect(staggerContainer.animate.transition.staggerChildren).toBe(0.1);
  });

  it('exports staggerItem for staggered children', () => {
    expect(staggerItem.initial).toEqual({ opacity: 0, y: 20 });
    expect(staggerItem.animate).toEqual({ opacity: 1, y: 0 });
    expect(staggerItem.transition).toEqual({
      duration: DURATION.normal,
      ease: EASE.default,
    });
  });
});
