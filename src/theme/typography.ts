import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  smallBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
};
