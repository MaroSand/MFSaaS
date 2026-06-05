export const colors = {
  // Brand
  primary:       '#7B1C1C',
  primaryLight:  '#F5E6E6',
  primaryDark:   '#5A1414',
  primaryPressed:'#6A1818',

  // Backgrounds
  background:    '#F8F8F8',
  surface:       '#FFFFFF',

  // Text
  textPrimary:   '#1A1A1A',
  textSecondary: '#666666',
  textDisabled:  '#AAAAAA',
  textInverse:   '#FFFFFF',

  // Borders
  border:        '#E0E0E0',
  borderFocus:   '#7B1C1C',

  // Semantic
  success:       '#2E7D32',
  successLight:  '#E8F5E9',
  warning:       '#F57C00',
  warningLight:  '#FFF3E0',
  error:         '#C62828',
  errorLight:    '#FFEBEE',
  info:          '#1565C0',
  infoLight:     '#E3F2FD',
} as const;

export type ColorKey = keyof typeof colors;
