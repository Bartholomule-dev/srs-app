import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/dashboard/LanguageSwitcher';

// Mock useActiveLanguage hook
const mockSetLanguage = vi.fn();

vi.mock('@/lib/hooks', () => ({
  useActiveLanguage: vi.fn(() => ({
    language: 'python',
    setLanguage: mockSetLanguage,
    isLoading: false,
    error: null,
  })),
}));

import { useActiveLanguage } from '@/lib/hooks';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'python',
      setLanguage: mockSetLanguage,
      isLoading: false,
      error: null,
    });
  });

  it('renders both Python and JavaScript language options', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('shows active state for current language (Python)', () => {
    render(<LanguageSwitcher />);

    const pythonButton = screen.getByRole('button', { name: /switch to python/i });
    expect(pythonButton).toHaveAttribute('aria-pressed', 'true');

    const jsButton = screen.getByRole('button', { name: /switch to javascript/i });
    expect(jsButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows active state for current language (JavaScript)', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'javascript',
      setLanguage: mockSetLanguage,
      isLoading: false,
      error: null,
    });

    render(<LanguageSwitcher />);

    const pythonButton = screen.getByRole('button', { name: /switch to python/i });
    expect(pythonButton).toHaveAttribute('aria-pressed', 'false');

    const jsButton = screen.getByRole('button', { name: /switch to javascript/i });
    expect(jsButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls setLanguage when a language button is clicked', () => {
    render(<LanguageSwitcher />);

    const jsButton = screen.getByRole('button', { name: /switch to javascript/i });
    fireEvent.click(jsButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('javascript');
  });

  it('calls setLanguage when clicking on already active language', () => {
    render(<LanguageSwitcher />);

    const pythonButton = screen.getByRole('button', { name: /switch to python/i });
    fireEvent.click(pythonButton);

    expect(mockSetLanguage).toHaveBeenCalledWith('python');
  });

  it('shows loading state when isLoading is true', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'python',
      setLanguage: mockSetLanguage,
      isLoading: true,
      error: null,
    });

    render(<LanguageSwitcher />);

    const loadingElement = screen.getByRole('status', { name: /loading language options/i });
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveClass('animate-pulse');
  });

  it('does not render language buttons during loading state', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'python',
      setLanguage: mockSetLanguage,
      isLoading: true,
      error: null,
    });

    render(<LanguageSwitcher />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Python')).not.toBeInTheDocument();
    expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
  });

  it('has accessible group role with proper label', () => {
    render(<LanguageSwitcher />);

    const group = screen.getByRole('group', { name: /language selection/i });
    expect(group).toBeInTheDocument();
  });

  it('buttons are disabled during loading', () => {
    vi.mocked(useActiveLanguage).mockReturnValue({
      language: 'python',
      setLanguage: mockSetLanguage,
      isLoading: true,
      error: null,
    });

    render(<LanguageSwitcher />);

    // Loading state renders a different component, no buttons
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders language icons from LanguageBadge', () => {
    render(<LanguageSwitcher />);

    // Python snake emoji
    expect(screen.getByText('\uD83D\uDC0D')).toBeInTheDocument();
    // JavaScript scroll emoji
    expect(screen.getByText('\uD83D\uDCDC')).toBeInTheDocument();
  });

  it('applies focus styles for keyboard navigation', () => {
    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  it('applies hover styles for mouse interaction', () => {
    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('hover:opacity-80');
    });
  });
});
