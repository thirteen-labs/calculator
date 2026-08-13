import { describe, it, expect } from '@jest/globals';
import { parseExpression, type ExprNode } from '../engine/parser';
import { CalcError } from '../errors';

describe('parseExpression', () => {
  it('parses a single number', () => {
    const ast = parseExpression('42');
    expect(ast).toEqual({ type: 'number', value: 42 });
  });

  it('parses addition', () => {
    const ast = parseExpression('2 + 3');
    expect(ast).toEqual({
      type: 'binary',
      op: '+',
      left: { type: 'number', value: 2 },
      right: { type: 'number', value: 3 },
    });
  });

  it('parses subtraction', () => {
    const ast = parseExpression('5 - 2');
    expect(ast).toEqual({
      type: 'binary',
      op: '-',
      left: { type: 'number', value: 5 },
      right: { type: 'number', value: 2 },
    });
  });

  it('parses multiplication', () => {
    const ast = parseExpression('3 × 4');
    expect(ast).toEqual({
      type: 'binary',
      op: '×',
      left: { type: 'number', value: 3 },
      right: { type: 'number', value: 4 },
    });
  });

  it('parses division', () => {
    const ast = parseExpression('8 ÷ 2');
    expect(ast).toEqual({
      type: 'binary',
      op: '÷',
      left: { type: 'number', value: 8 },
      right: { type: 'number', value: 2 },
    });
  });

  it('respects operator precedence (multiplication before addition)', () => {
    const ast = parseExpression('2 + 3 × 4');
    expect(ast).toEqual({
      type: 'binary',
      op: '+',
      left: { type: 'number', value: 2 },
      right: {
        type: 'binary',
        op: '×',
        left: { type: 'number', value: 3 },
        right: { type: 'number', value: 4 },
      },
    });
  });

  it('respects parentheses for grouping', () => {
    const ast = parseExpression('(2 + 3) × 4');
    expect(ast).toEqual({
      type: 'binary',
      op: '×',
      left: {
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 },
      },
      right: { type: 'number', value: 4 },
    });
  });

  it('parses unary negation', () => {
    const ast = parseExpression('-5');
    expect(ast).toEqual({
      type: 'unary',
      op: '-',
      arg: { type: 'number', value: 5 },
    });
  });

  it('parses unary minus with exponentiation (right-associative)', () => {
    // -2^3 should be -(2^3) = -8
    const ast = parseExpression('-2^3');
    expect(ast).toEqual({
      type: 'unary',
      op: '-',
      arg: {
        type: 'binary',
        op: '^',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 },
      },
    });
  });

  it('parses exponentiation right-associative', () => {
    const ast = parseExpression('2^3^2');
    expect(ast).toEqual({
      type: 'binary',
      op: '^',
      left: { type: 'number', value: 2 },
      right: {
        type: 'binary',
        op: '^',
        left: { type: 'number', value: 3 },
        right: { type: 'number', value: 2 },
      },
    });
  });

  it('parses factorial', () => {
    const ast = parseExpression('5!');
    expect(ast).toEqual({
      type: 'factorial',
      arg: { type: 'number', value: 5 },
    });
  });

  it('parses double factorial', () => {
    const ast = parseExpression('5!!');
    expect(ast).toEqual({
      type: 'factorial',
      arg: {
        type: 'factorial',
        arg: { type: 'number', value: 5 },
      },
    });
  });

  it('parses functions with one argument', () => {
    const ast = parseExpression('sqrt(4)');
    expect(ast).toEqual({
      type: 'function',
      name: 'sqrt',
      args: [{ type: 'number', value: 4 }],
    });
  });

  it('parses constants', () => {
    expect(parseExpression('π')).toEqual({ type: 'constant', value: 'PI' });
    expect(parseExpression('e')).toEqual({ type: 'constant', value: 'E' });
  });

  it('throws on unmatched opening parenthesis', () => {
    expect(() => parseExpression('(1 + 2')).toThrow(CalcError);
  });

  it('throws on unmatched closing parenthesis', () => {
    expect(() => parseExpression('1 + 2)')).toThrow(CalcError);
  });

  it('throws on empty expression', () => {
    expect(() => parseExpression('')).toThrow(CalcError);
  });

  it('throws on trailing operator', () => {
    expect(() => parseExpression('1 +')).toThrow(CalcError);
  });

  it('throws on function without parentheses', () => {
    expect(() => parseExpression('sin')).toThrow(CalcError);
    expect(() => parseExpression('sin 4')).toThrow(CalcError);
  });

  it('handles implicit multiplication via tokenizer', () => {
    const ast = parseExpression('2(1+2)');
    expect(ast).toEqual({
      type: 'binary',
      op: '×',
      left: { type: 'number', value: 2 },
      right: {
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 1 },
        right: { type: 'number', value: 2 },
      },
    });
  });

  it('handles implicit multiplication with constant', () => {
    const ast = parseExpression('2π');
    expect(ast).toEqual({
      type: 'binary',
      op: '×',
      left: { type: 'number', value: 2 },
      right: { type: 'constant', value: 'PI' },
    });
  });

  it('handles modulo operator', () => {
    const ast = parseExpression('10 % 3');
    expect(ast).toEqual({
      type: 'binary',
      op: '%',
      left: { type: 'number', value: 10 },
      right: { type: 'number', value: 3 },
    });
  });

  it('handles nested parentheses', () => {
    const ast = parseExpression('((2))');
    expect(ast).toEqual({ type: 'number', value: 2 });
  });
});
