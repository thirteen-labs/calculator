import { describe, it, expect } from '@jest/globals';
import { tokenize, insertImplicitMultiplication } from '../engine/tokenizer';
import { CalcError } from '../errors';

describe('tokenize', () => {
  it('parses basic numbers', () => {
    const tokens = tokenize('123');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'number', value: 123 });
  });

  it('parses decimal numbers', () => {
    const tokens = tokenize('3.14');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'number', value: 3.14 });
  });

  it('parses leading-dot decimals', () => {
    const tokens = tokenize('.5');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'number', value: 0.5 });
  });

  it('parses scientific notation', () => {
    expect(tokenize('1e10')).toEqual([{ type: 'number', value: 1e10 }]);
    expect(tokenize('1.5e-3')).toEqual([{ type: 'number', value: 0.0015 }]);
    expect(tokenize('1E5')).toEqual([{ type: 'number', value: 100000 }]);
    expect(tokenize('2e+4')).toEqual([{ type: 'number', value: 20000 }]);
  });

  it('parses operators', () => {
    expect(tokenize('+')).toEqual([{ type: 'operator', value: '+' }]);
    expect(tokenize('-')).toEqual([{ type: 'operator', value: '-' }]);
    expect(tokenize('×')).toEqual([{ type: 'operator', value: '×' }]);
    expect(tokenize('*')).toEqual([{ type: 'operator', value: '×' }]);
    expect(tokenize('÷')).toEqual([{ type: 'operator', value: '÷' }]);
    expect(tokenize('/')).toEqual([{ type: 'operator', value: '÷' }]);
    expect(tokenize('%')).toEqual([{ type: 'operator', value: '%' }]);
    expect(tokenize('^')).toEqual([{ type: 'operator', value: '^' }]);
  });

  it('parses unicode operators', () => {
    expect(tokenize('−')).toEqual([{ type: 'operator', value: '-' }]);
    expect(tokenize('–')).toEqual([{ type: 'operator', value: '-' }]);
    expect(tokenize('·')).toEqual([{ type: 'operator', value: '×' }]);
  });

  it('parses parentheses', () => {
    expect(tokenize('(')).toEqual([{ type: 'lparen' }]);
    expect(tokenize(')')).toEqual([{ type: 'rparen' }]);
  });

  it('parses factorial', () => {
    expect(tokenize('!')).toEqual([{ type: 'factorial' }]);
  });

  it('parses constants (pi)', () => {
    expect(tokenize('π')).toEqual([{ type: 'constant', value: 'PI' }]);
    expect(tokenize('Π')).toEqual([{ type: 'constant', value: 'PI' }]);
    expect(tokenize('pi')).toEqual([{ type: 'constant', value: 'PI' }]);
    expect(tokenize('PI')).toEqual([{ type: 'constant', value: 'PI' }]);
  });

  it('parses constant e', () => {
    expect(tokenize('e')).toEqual([{ type: 'constant', value: 'E' }]);
  });

  it('parses functions', () => {
    expect(tokenize('sin')).toEqual([{ type: 'function', value: 'sin' }]);
    expect(tokenize('sqrt')).toEqual([{ type: 'function', value: 'sqrt' }]);
    expect(tokenize('cbrt')).toEqual([{ type: 'function', value: 'cbrt' }]);
    expect(tokenize('log2')).toEqual([{ type: 'function', value: 'log2' }]);
    expect(tokenize('asin')).toEqual([{ type: 'function', value: 'asin' }]);
    expect(tokenize('log')).toEqual([{ type: 'function', value: 'log' }]);
    expect(tokenize('ln')).toEqual([{ type: 'function', value: 'ln' }]);
  });

  it('parses function name case-insensitively', () => {
    expect(tokenize('SIN')).toEqual([{ type: 'function', value: 'sin' }]);
    expect(tokenize('Sqrt')).toEqual([{ type: 'function', value: 'sqrt' }]);
    expect(tokenize('ABS')).toEqual([{ type: 'function', value: 'abs' }]);
  });

  it('throws on unknown function/identifier', () => {
    expect(() => tokenize('xyz')).toThrow(CalcError);
    expect(() => tokenize('foo')).toThrow(CalcError);
  });

  it('throws on unexpected characters', () => {
    expect(() => tokenize('@')).toThrow(CalcError);
    expect(() => tokenize('#')).toThrow(CalcError);
  });

  it('throws on number too large', () => {
    expect(() => tokenize('1e999')).toThrow(CalcError);
  });

  it('handles whitespace', () => {
    const tokens = tokenize('1 + 2');
    expect(tokens).toHaveLength(3);
  });

  it('handles complex expressions', () => {
    const tokens = tokenize('sin(30) + sqrt(4)');
    expect(tokens).toEqual([
      { type: 'function', value: 'sin' },
      { type: 'lparen' },
      { type: 'number', value: 30 },
      { type: 'rparen' },
      { type: 'operator', value: '+' },
      { type: 'function', value: 'sqrt' },
      { type: 'lparen' },
      { type: 'number', value: 4 },
      { type: 'rparen' },
    ]);
  });

  it('does not treat "e" as constant when followed by a letter', () => {
    expect(() => tokenize('exp')).toThrow(CalcError);
  });
});

describe('insertImplicitMultiplication', () => {
  it('inserts multiplication between number and parenthesis', () => {
    const tokens = tokenize('2(1+2)');
    const result = insertImplicitMultiplication(tokens);
    expect(result).toContainEqual({ type: 'operator', value: '×' });
  });

  it('inserts multiplication between number and constant', () => {
    const tokens = tokenize('2π');
    const result = insertImplicitMultiplication(tokens);
    expect(result).toContainEqual({ type: 'operator', value: '×' });
  });

  it('inserts multiplication between closing paren and opening paren', () => {
    const tokens = tokenize('(1+2)(3+4)');
    const result = insertImplicitMultiplication(tokens);
    expect(result).toContainEqual({ type: 'operator', value: '×' });
  });

  it('does not insert multiplication between factorial and factorial', () => {
    const tokens = tokenize('5!!');
    const result = insertImplicitMultiplication(tokens);
    // Should be: number, factorial, factorial (no multiplication inserted)
    const multCount = result.filter((t) => t.type === 'operator' && t.value === '×').length;
    expect(multCount).toBe(0);
  });

  it('does not insert multiplication for empty input', () => {
    expect(insertImplicitMultiplication([])).toEqual([]);
  });

  it('does not insert multiplication at start of atom', () => {
    const tokens = tokenize('2');
    expect(insertImplicitMultiplication(tokens)).toEqual(tokens);
  });
});
