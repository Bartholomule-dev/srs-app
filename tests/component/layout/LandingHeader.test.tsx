// tests/component/layout/LandingHeader.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LandingHeader } from '@/components/layout/LandingHeader';

describe('LandingHeader', () => {
  it('renders logo with gradient text', () => {
    render(<LandingHeader />);
    const logo = screen.getByText(/syntaxsrs/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('bg-gradient-to-r');
  });

  it('renders navigation links on desktop', () => {
    render(<LandingHeader />);

    const featuresLink = screen.getByRole('link', { name: /features/i });
    expect(featuresLink).toHaveAttribute('href', '#features');

    const howItWorksLink = screen.getByRole('link', { name: /how it works/i });
    expect(howItWorksLink).toHaveAttribute('href', '#how-it-works');
  });

  it('renders Sign In button', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('has sticky positioning with backdrop blur', () => {
    render(<LandingHeader />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('backdrop-blur-lg');
  });

  it('dispatches showAuthForm event and scrolls to auth form when buttons clicked', async () => {
    // Track custom event dispatch
    const eventHandler = vi.fn();
    window.addEventListener('showAuthForm', eventHandler);

    // Create a mock email input
    const mockInput = document.createElement('input');
    mockInput.type = 'email';
    mockInput.focus = vi.fn();
    mockInput.scrollIntoView = vi.fn();
    document.body.appendChild(mockInput);

    render(<LandingHeader />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    // Verify the custom event is dispatched immediately
    expect(eventHandler).toHaveBeenCalled();

    // Wait for the setTimeout(100ms) to execute focus/scroll
    await waitFor(() => {
      expect(mockInput.focus).toHaveBeenCalled();
    }, { timeout: 200 });

    expect(mockInput.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    // Clean up
    document.body.removeChild(mockInput);
    window.removeEventListener('showAuthForm', eventHandler);
  });
});
