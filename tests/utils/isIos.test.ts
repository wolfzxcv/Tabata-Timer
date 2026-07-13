import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIos } from '../../src/utils/isIos';

describe('isIos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects iPhone user agent', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5
    });
    expect(isIos()).toBe(true);
  });

  it('does not detect desktop Chrome', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      platform: 'Win32',
      maxTouchPoints: 0
    });
    expect(isIos()).toBe(false);
  });
});
