import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SplashScreen } from '../components/ui/SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should display the logo and app name initially', () => {
    render(<SplashScreen onFinish={() => {}} />);
    expect(screen.getByAltText('PYU GO Logo')).toBeDefined();
    expect(screen.getByText('PYU')).toBeDefined();
    expect(screen.getByText('GO')).toBeDefined();
  });

  it('should call onFinish after 5 seconds', () => {
    const onFinish = vi.fn();
    render(<SplashScreen onFinish={onFinish} />);
    
    // Advance time by 4.9 seconds (should not have finished yet)
    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(onFinish).not.toHaveBeenCalled();

    // Advance to 5 seconds
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should start fading out at 4.5 seconds', () => {
    const { container } = render(<SplashScreen onFinish={() => {}} />);
    const splashDiv = container.firstChild as HTMLElement;
    
    expect(splashDiv.className).toContain('opacity-100');

    act(() => {
      vi.advanceTimersByTime(4501);
    });

    expect(splashDiv.className).toContain('opacity-0');
  });
});
