import { describe, it, expect } from '@jest/globals';
import { evaluateExpression, evaluateNode, getLastOperation } from '../engine/evaluator';
import { parseExpression } from '../engine/parser';
import { CalcError } from '../errors';

const MUL = String.fromCharCode(215);
const DIV = String.fromCharCode(247);
const PI = String.fromCharCode(960);

describe('evaluateExpression', () => {
  it('evaluates basic arithmetic', () => {
    expect(evaluateExpression('2 + 3')).toBe(5);
    expect(evaluateExpression('10 - 4')).toBe(6);
    expect(evaluateExpression(`5 ${MUL} 3`)).toBe(15);
    expect(evaluateExpression(`10 ${DIV} 2`)).toBe(5);
  });

  it('respects operator precedence', () => {
    expect(evaluateExpression(`2 + 3 ${MUL} 4`)).toBe(14);
    expect(evaluateExpression(`2 + 3 ${MUL} 4`)).toBe(14);
    expect(evaluateExpression(`10 - 2 ${MUL} 3`)).toBe(4);
  });

  it('respects parentheses', () => {
    expect(evaluateExpression('(2 + 3) x 4'.replace('x', MUL))).toBe(20);
    expect(evaluateExpression('(10 - 2) / 2')).toBe(4);
  });

  it('evaluates unary negation', () => {
    expect(evaluateExpression('-5')).toBe(-5);
    expect(evaluateExpression('-3^2')).toBe(-9);
  });

  it('evaluates power operator', () => {
    expect(evaluateExpression('2^3')).toBe(8);
    expect(evaluateExpression('2^0')).toBe(1);
    expect(evaluateExpression('2^-3')).toBe(0.125);
  });

  it('evaluates factorial', () => {
    expect(evaluateExpression('0!')).toBe(1);
    expect(evaluateExpression('1!')).toBe(1);
    expect(evaluateExpression('5!')).toBe(120);
    expect(evaluateExpression('6!')).toBe(720);
  });

  it('evaluates constants', () => {
    expect(evaluateExpression(PI)).toBe(Math.PI);
    expect(evaluateExpression('e')).toBe(Math.E);
    expect(evaluateExpression(`2 ${PI}`)).toBeCloseTo(2 * Math.PI);
  });

  it('evaluates modulo', () => {
    expect(evaluateExpression('10 % 3')).toBe(1);
    expect(evaluateExpression('7 % 5')).toBe(2);
  });

  it('evaluates square root', () => {
    expect(evaluateExpression('sqrt(4)')).toBe(2);
    expect(evaluateExpression('sqrt(2)')).toBeCloseTo(Math.SQRT2);
  });

  it('evaluates trigonometric functions in DEG mode', () => {
    expect(evaluateExpression('sin(30)', { angleMode: 'DEG' })).toBeCloseTo(0.5);
    expect(evaluateExpression('cos(60)', { angleMode: 'DEG' })).toBeCloseTo(0.5);
    expect(evaluateExpression('tan(45)', { angleMode: 'DEG' })).toBeCloseTo(1);
  });

  it('evaluates trigonometric functions in RAD mode', () => {
    expect(evaluateExpression('sin(0)', { angleMode: 'RAD' })).toBe(0);
    expect(evaluateExpression('cos(0)', { angleMode: 'RAD' })).toBe(1);
  });

  it('evaluates arc trigonometric functions', () => {
    expect(evaluateExpression('asin(1)', { angleMode: 'DEG' })).toBeCloseTo(90);
    expect(evaluateExpression('acos(0)', { angleMode: 'DEG' })).toBeCloseTo(90);
    expect(evaluateExpression('atan(1)', { angleMode: 'DEG' })).toBeCloseTo(45);
  });

  it('evaluates logarithmic functions', () => {
    expect(evaluateExpression('log(100)')).toBeCloseTo(2);
    expect(evaluateExpression('ln(e)')).toBeCloseTo(1);
    expect(evaluateExpression('log2(8)')).toBeCloseTo(3);
  });

  it('evaluates other functions', () => {
    expect(evaluateExpression('abs(-5)')).toBe(5);
    expect(evaluateExpression('floor(3.7)')).toBe(3);
    expect(evaluateExpression('ceil(3.2)')).toBe(4);
    expect(evaluateExpression('sign(-5)')).toBe(-1);
    expect(evaluateExpression('sign(5)')).toBe(1);
    expect(evaluateExpression('cbrt(27)')).toBe(3);
    expect(evaluateExpression('square(4)')).toBe(16);
    expect(evaluateExpression('cube(3)')).toBe(27);
    expect(evaluateExpression('reciprocal(4)')).toBe(0.25);
  });

  it('throws on division by zero', () => {
    expect(() => evaluateExpression('1 / 0')).toThrow(CalcError);
    expect(() => evaluateExpression(`1 ${DIV} 0`)).toThrow(CalcError);
  });

  it('throws on modulo by zero', () => {
    expect(() => evaluateExpression('5 % 0')).toThrow(CalcError);
  });

  it('throws on square root of negative', () => {
    expect(() => evaluateExpression('sqrt(-1)')).toThrow(CalcError);
  });

  it('throws on negative base with fractional exponent', () => {
    expect(() => evaluateExpression('(-2)^0.5')).toThrow(CalcError);
  });

  it('throws on factorial of non-integer', () => {
    expect(() => evaluateExpression('1.5!')).toThrow(CalcError);
  });

  it('throws on factorial of negative', () => {
    expect(() => evaluateExpression('(-3)!')).toThrow(CalcError);
  });

  it('throws on domain errors for inverse trig', () => {
    expect(() => evaluateExpression('asin(2)', { angleMode: 'DEG' })).toThrow(CalcError);
    expect(() => evaluateExpression('acos(2)', { angleMode: 'DEG' })).toThrow(CalcError);
  });

  it('throws on log of non-positive', () => {
    expect(() => evaluateExpression('log(0)')).toThrow(CalcError);
    expect(() => evaluateExpression('ln(-1)')).toThrow(CalcError);
    expect(() => evaluateExpression('log2(0)')).toThrow(CalcError);
  });

  it('throws on expression with too many digits', () => {
    expect(() => evaluateExpression('1e999')).toThrow(CalcError);
  });

  it('throws on empty expression', () => {
    expect(() => evaluateExpression('')).toThrow(CalcError);
  });

  it('handles implicit multiplication', () => {
    expect(evaluateExpression('2(1+2)')).toBe(6);
    expect(evaluateExpression(`(1+2)(3+4)`)).toBe(21);
    expect(evaluateExpression(`2${PI}`)).toBeCloseTo(2 * Math.PI);
  });

  it('handles scientific notation expressions', () => {
    expect(evaluateExpression('1e2 + 1e2')).toBe(200);
    expect(evaluateExpression('1.5e2')).toBe(150);
  });

  it('defaults to RAD for trig functions', () => {
    expect(evaluateExpression('sin(0)')).toBe(0);
  });
});

describe('evaluateNode', () => {
  it('evaluates from a pre-parsed AST', () => {
    const node = parseExpression('3 + 4');
    expect(evaluateNode(node)).toBe(7);
  });

  it('defaults to RAD angle mode', () => {
    const node = parseExpression('sin(0)');
    expect(evaluateNode(node)).toBe(0);
  });
});

describe('getLastOperation', () => {
  it('returns the last binary operator and operand', () => {
    const result = getLastOperation('2 + 3');
    expect(result).toEqual({ operator: '+', operand: '3' });
  });

  it('returns nested operator and operand', () => {
    const result = getLastOperation(`2 + 3 ${MUL} 4`);
    expect(result).toEqual({ operator: '×', operand: '4' });
  });

  it('returns null for non-binary expressions', () => {
    expect(getLastOperation('5')).toBeNull();
  });

  it('handles complex expressions', () => {
    const result = getLastOperation(`10 ${DIV} 2 + 3`);
    expect(result).toEqual({ operator: '+', operand: '3' });
  });
});
