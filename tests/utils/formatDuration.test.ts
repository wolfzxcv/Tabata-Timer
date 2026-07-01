import { describe, expect, it } from 'vitest';
import { formatDuration } from '../../src/utils/formatDuration';

describe('formatDuration', () => {
  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0 sec');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(400)).toBe('6 min 40 sec');
  });

  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1 hr 1 min 1 sec');
  });

  it('formats seconds only', () => {
    expect(formatDuration(59)).toBe('59 sec');
  });
});
