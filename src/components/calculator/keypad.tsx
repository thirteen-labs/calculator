import React from 'react';
import { Host, Column, Text, Row, Button } from '@expo/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CalculatorState, Action, BinaryOperator, FunctionName } from '@/calc';
import type { ThemeColors } from './calculator';
import { formatNumber } from '@/calc/engine';

type KeypadProps = {
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
  buttonSize: number;
  smallBtnSize: number;
  spacing: number;
  keypadWidth: number;
  bottomInset: number;
};

export function Keypad({
  state,
  dispatch,
  theme,
  buttonSize,
  smallBtnSize,
  spacing,
  keypadWidth,
  bottomInset,
}: KeypadProps) {
  const sciRows: { label: string; action: Action }[][] =
    state.mode === 'scientific'
      ? [
          [
            { label: '+/−', action: { type: 'INPUT_NEGATIVE' } },
            { label: state.angleMode, action: { type: 'SET_ANGLE_MODE', mode: state.angleMode === 'DEG' ? 'RAD' : state.angleMode === 'RAD' ? 'GRAD' : 'DEG' } },
          ],
          [
            { label: 'sin', action: { type: 'INPUT_FUNCTION', fn: 'sin' } },
            { label: 'cos', action: { type: 'INPUT_FUNCTION', fn: 'cos' } },
            { label: 'tan', action: { type: 'INPUT_FUNCTION', fn: 'tan' } },
            { label: String.fromCharCode(960), action: { type: 'INPUT_CONSTANT', constant: 'PI' } },
          ],
          [
            { label: String.fromCharCode(8730), action: { type: 'INPUT_FUNCTION', fn: 'sqrt' } },
            { label: 'x' + String.fromCharCode(178), action: { type: 'INPUT_FUNCTION', fn: 'square' } },
            { label: '1/x', action: { type: 'INPUT_FUNCTION', fn: 'reciprocal' } },
            { label: 'e', action: { type: 'INPUT_CONSTANT', constant: 'E' } },
          ],
          [
            { label: 'log', action: { type: 'INPUT_FUNCTION', fn: 'log' } },
            { label: 'ln', action: { type: 'INPUT_FUNCTION', fn: 'ln' } },
            { label: 'n!', action: { type: 'INPUT_FUNCTION', fn: 'factorial' } },
            { label: 'y' + String.fromCharCode(7506), action: { type: 'INPUT_OPERATOR', operator: '^' } },
          ],
        ]
      : [];

  const mult = String.fromCharCode(215);
  const minus = String.fromCharCode(8722);
  const div = String.fromCharCode(247);

  const opens = (state.expression.match(/\(/g) ?? []).length;
  const closes = (state.expression.match(/\)/g) ?? []).length;
  const lastChar = state.expression.trim().slice(-1);
  const canCloseParens =
    opens > closes &&
    ((lastChar >= '0' && lastChar <= '9') || lastChar === ')' || lastChar === '.' || lastChar === '!');
  const parenAction: Action = { type: 'INPUT_PAREN', paren: canCloseParens ? ')' : '(' };

  const basicRows: { label: string; action: Action; bg?: string }[][] = [
    [
      { label: 'AC', action: { type: 'CLEAR' }, bg: 'function' },
      { label: '( )', action: parenAction },
      { label: '%', action: { type: 'INPUT_OPERATOR', operator: '%' }, bg: 'function' },
      { label: div, action: { type: 'INPUT_OPERATOR', operator: '÷' }, bg: 'accent' },
    ],
    [
      { label: '7', action: { type: 'INPUT_DIGIT', digit: '7' } },
      { label: '8', action: { type: 'INPUT_DIGIT', digit: '8' } },
      { label: '9', action: { type: 'INPUT_DIGIT', digit: '9' } },
      { label: mult, action: { type: 'INPUT_OPERATOR', operator: '×' }, bg: 'accent' },
    ],
    [
      { label: '4', action: { type: 'INPUT_DIGIT', digit: '4' } },
      { label: '5', action: { type: 'INPUT_DIGIT', digit: '5' } },
      { label: '6', action: { type: 'INPUT_DIGIT', digit: '6' } },
      { label: minus, action: { type: 'INPUT_OPERATOR', operator: '-' }, bg: 'accent' },
    ],
    [
      { label: '1', action: { type: 'INPUT_DIGIT', digit: '1' } },
      { label: '2', action: { type: 'INPUT_DIGIT', digit: '2' } },
      { label: '3', action: { type: 'INPUT_DIGIT', digit: '3' } },
      { label: '+', action: { type: 'INPUT_OPERATOR', operator: '+' }, bg: 'accent' },
    ],
    [
      { label: '0', action: { type: 'INPUT_DIGIT', digit: '0' } },
      { label: '.', action: { type: 'INPUT_DECIMAL' } },
      { label: '=', action: { type: 'EVALUATE' }, bg: 'accent' },
    ],
  ];

  const digitBg = theme.backgroundElement;
  const textBg = theme.text;
  const textSec = theme.textSecondary;

  return (
    <Column alignment="center" spacing={spacing} style={{ width: '100%', paddingHorizontal: 8, paddingBottom: bottomInset + spacing }}>
      {sciRows.map((row, ri) => (
        <Row key={`sci-${ri}`} alignment="center" spacing={spacing}>
          {row.map((btn, bi) => (
            <CalcButton
              key={`sci-${ri}-${bi}`}
              label={btn.label}
              onPress={() => dispatch(btn.action)}
              size={smallBtnSize}
              bgColor={digitBg}
              textColor={textBg}
            />
          ))}
        </Row>
      ))}
      {basicRows.map((row, ri) => {
        if (ri === basicRows.length - 1) {
          return (
            <Row key={`row-${ri}`} alignment="center" spacing={spacing}>
              <CalcButton
                label={row[0].label}
                onPress={() => dispatch(row[0].action)}
                size={buttonSize * 2 + spacing}
                bgColor={digitBg}
                textColor={textBg}
              />
              <CalcButton
                label={row[1].label}
                onPress={() => dispatch(row[1].action)}
                size={buttonSize}
                bgColor={digitBg}
                textColor={textBg}
              />
              <CalcButton
                label={row[2].label}
                onPress={() => dispatch(row[2].action)}
                size={buttonSize}
                bgColor={row[2].bg === 'accent' ? theme.accent : digitBg}
                textColor={row[2].bg === 'accent' ? theme.accentText : textBg}
              />
            </Row>
          );
        }
        return (
          <Row key={`row-${ri}`} alignment="center" spacing={spacing}>
            {row.map((btn, bi) => {
              const isOp = btn.bg === 'accent';
              const isFunc = btn.bg === 'function';
              return (
                <CalcButton
                  key={`row-${ri}-${bi}`}
                  label={btn.label}
                  onPress={() => dispatch(btn.action)}
                  size={buttonSize}
                  bgColor={isOp ? theme.accent : isFunc ? theme.functionBg : digitBg}
                  textColor={isOp ? theme.accentText : isFunc ? theme.functionText : textBg}
                />
              );
            })}
          </Row>
        );
      })}
    </Column>
  );
}

function CalcButton({
  label,
  onPress,
  size,
  bgColor,
  textColor,
}: {
  label: string;
  onPress: () => void;
  size: number;
  bgColor: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Text textStyle={{ fontSize: 22, fontWeight: '500', color: textColor, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keypad: {
    width: '100%',
    paddingHorizontal: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
