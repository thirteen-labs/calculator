import { CalcError } from '@/calc/errors';
import type { BinaryOperator, FunctionName } from '@/calc/types';
import { insertImplicitMultiplication, tokenize, type Token } from './tokenizer';

export type ExprNode =
  | { type: 'number'; value: number }
  | { type: 'constant'; value: 'PI' | 'E' }
  | { type: 'binary'; op: BinaryOperator; left: ExprNode; right: ExprNode }
  | { type: 'unary'; op: '-'; arg: ExprNode }
  | { type: 'function'; name: FunctionName; args: ExprNode[] }
  | { type: 'factorial'; arg: ExprNode };

class Parser {
  private tokens: Token[];
  private index = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private next(): Token | undefined {
    return this.tokens[this.index++];
  }

  private expectOperator(value: BinaryOperator): void {
    const token = this.next();
    if (token?.type !== 'operator' || token.value !== value) {
      throw new CalcError('INVALID_EXPRESSION');
    }
  }

  parse(): ExprNode {
    if (this.tokens.length === 0) {
      throw new CalcError('INVALID_EXPRESSION');
    }
    const node = this.expression();
    if (this.peek() !== undefined) {
      throw new CalcError('SYNTAX_ERROR');
    }
    return node;
  }

  private expression(): ExprNode {
    let left = this.term();
    while (true) {
      const token = this.peek();
      if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
        this.next();
        const right = this.term();
        left = { type: 'binary', op: token.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private term(): ExprNode {
    let left = this.unary();
    while (true) {
      const token = this.peek();
      if (
        token?.type === 'operator' &&
        (token.value === '×' || token.value === '÷' || token.value === '%')
      ) {
        this.next();
        const right = this.unary();
        left = { type: 'binary', op: token.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private unary(): ExprNode {
    const token = this.peek();
    if (token?.type === 'operator' && (token.value === '-' || token.value === '+')) {
      this.next();
      const arg = this.unary();
      return token.value === '-' ? { type: 'unary', op: '-', arg } : arg;
    }
    return this.power();
  }

  private power(): ExprNode {
    const base = this.postfix();
    const token = this.peek();
    if (token?.type === 'operator' && token.value === '^') {
      this.next();
      const exponent = this.unary();
      return { type: 'binary', op: '^', left: base, right: exponent };
    }
    return base;
  }

  private postfix(): ExprNode {
    let node = this.primary();
    while (this.peek()?.type === 'factorial') {
      this.next();
      node = { type: 'factorial', arg: node };
    }
    return node;
  }

  private primary(): ExprNode {
    const token = this.next();
    if (token === undefined) {
      throw new CalcError('MISSING_OPERAND');
    }

    switch (token.type) {
      case 'number':
        return { type: 'number', value: token.value };
      case 'constant':
        return { type: 'constant', value: token.value };
      case 'lparen': {
        const inner = this.expression();
        const close = this.next();
        if (close?.type !== 'rparen') {
          throw new CalcError('UNMATCHED_PARENTHESES');
        }
        return inner;
      }
      case 'function': {
        const open = this.next();
        if (open?.type !== 'lparen') {
          throw new CalcError('MISSING_OPERAND', `Expected "(" after ${token.value}`);
        }
        const args: ExprNode[] = [this.expression()];
        const close = this.next();
        if (close?.type !== 'rparen') {
          throw new CalcError('UNMATCHED_PARENTHESES');
        }
        return { type: 'function', name: token.value, args };
      }
      case 'operator':
        throw new CalcError('MISSING_OPERAND');
      case 'rparen':
        throw new CalcError('UNMATCHED_PARENTHESES');
      case 'factorial':
        throw new CalcError('MISSING_OPERAND');
    }
  }
}

export function parseExpression(expression: string): ExprNode {
  const tokens = insertImplicitMultiplication(tokenize(expression));
  return new Parser(tokens).parse();
}