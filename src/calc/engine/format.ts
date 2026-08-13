function cleanExponential(value: number, limit: number): string {
  const digits = Math.min(limit, 6);
  const raw = value.toExponential(digits);
  const [mantissa, exponent] = raw.split('e');
  const cleaned = mantissa.replace(/\.?0+$/, '');
  return cleaned + 'e' + exponent;
}

export function formatNumber(value: number, precision = 10): string {
  if (Number.isNaN(value)) {
    return 'NaN';
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? '∞' : '-∞';
  }
  if (Object.is(value, -0)) {
    return '0';
  }
  const limit = Math.max(0, Math.min(precision, 20));
  const abs = Math.abs(value);

  if (abs !== 0 && (abs >= 1e17 || abs < 1e-9)) {
    return cleanExponential(value, limit);
  }

  const rounded = Number(value.toFixed(limit));
  return String(rounded);
}