import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display:    { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  heading:    { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  subheading: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body:       { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption:    { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label:      { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  price:      { fontSize: 20, fontWeight: '700', lineHeight: 28 },
};
