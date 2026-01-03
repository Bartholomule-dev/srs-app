import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from '@/components/dashboard/Greeting';

describe('Greeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Good morning!" between 5am and noon', () => {
    vi.setSystemTime(new Date('2024-01-15T09:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good morning!')).toBeInTheDocument();
  });

  it('shows "Good afternoon!" between noon and 5pm', () => {
    vi.setSystemTime(new Date('2024-01-15T14:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good afternoon!')).toBeInTheDocument();
  });

  it('shows "Good evening!" between 5pm and 9pm', () => {
    vi.setSystemTime(new Date('2024-01-15T19:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good evening!')).toBeInTheDocument();
  });

  it('shows "Good night!" between 9pm and 5am', () => {
    vi.setSystemTime(new Date('2024-01-15T23:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good night!')).toBeInTheDocument();
  });

  it('shows "Good night!" at 4am (early morning)', () => {
    vi.setSystemTime(new Date('2024-01-15T04:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good night!')).toBeInTheDocument();
  });

  it('shows "Good morning!" at exactly 5am', () => {
    vi.setSystemTime(new Date('2024-01-15T05:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good morning!')).toBeInTheDocument();
  });

  it('shows "Good afternoon!" at exactly noon', () => {
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good afternoon!')).toBeInTheDocument();
  });

  it('shows "Good evening!" at exactly 5pm', () => {
    vi.setSystemTime(new Date('2024-01-15T17:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good evening!')).toBeInTheDocument();
  });

  it('shows "Good night!" at exactly 9pm', () => {
    vi.setSystemTime(new Date('2024-01-15T21:00:00'));
    render(<Greeting />);
    expect(screen.getByText('Good night!')).toBeInTheDocument();
  });

  it('displays ready to practice subtext', () => {
    render(<Greeting />);
    expect(screen.getByText('Ready to practice?')).toBeInTheDocument();
  });
});
