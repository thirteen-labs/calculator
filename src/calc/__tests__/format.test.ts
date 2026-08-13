import { describe, it, expect } from '@jest/globals';
import { formatNumber } from '../engine/format';

describe('formatNumber', () => {
  it('formats integers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(123)).toBe('123');
  });

  it('formats decimals', () => {
    expect(formatNumber(3.14, 10)).toBe('3.14');
    expect(formatNumber(0.5, 10)).toBe('0.5');
    expect(formatNumber(0.333, 10)).toBe('0.333');
  });

  it('handles negative zero -> 0', () => {
    expect(formatNumber(-0, 10)).toBe('0');
  });

  it('handles floating-point precision issues', () => {
    expect(formatNumber(0.1 + 0.2, 10)).toBe('0.3');
    expect(formatNumber(0.3 - 0.1, 10)).toBe('0.2');
  });

  it('formats infinity', () => {
    expect(formatNumber(Infinity)).toBe('∞');
    expect(formatNumber(-Infinity)).toBe('-∞');
  });

  it('formats NaN', () => {
    expect(formatNumber(NaN)).toBe('NaN');
  });

  it('formats very small numbers with exponential notation', () => {
    expect(formatNumber(1e-10, 10)).toBe('1e-10');
    expect(formatNumber(1e-13, 10)).toBe('1e-13');
  });

  it('formats very large numbers with exponential notation', () => {
    expect(formatNumber(1e17, 10)).toBe('1e+17');
    expect(formatNumber(1e20, 10)).toBe('1e+20');
  });

  it('formats large but not exponential numbers normally', () => {
    expect(formatNumber(999999999999999, 10)).toBe('999999999999999');
    expect(formatNumber(123456789, 10)).toBe('123456789');
  });

  it('respects precision', () => {
    expect(formatNumber(3.14159265, 2)).toBe('3.14');
    expect(formatNumber(3.14159265, 5)).toBe('3.14159');
    expect(formatNumber(3.14159265, 10)).toBe('3.14159265');
  });

  it('caps precision at 20', () => {
    expect(formatNumber(1.1, 50)).toBe(formatNumber(1.1, 20));
  });

  it('handles minimum precision of 0', () => {
    expect(formatNumber(3.7, 0)).toBe('4');
    expect(formatNumber(3.3, 0)).toBe('3');
  });

  it('handles exponential clean formatting', () => {
    const result = formatNumber(123456789012345678901234567890, 10);
    expect(result).toMatch(/e\+29/);
  });
});
