export const colors = {
  plum: '#7251A6',
  violet: '#4F357A',
  lavender: '#B9A3E3',
  paleLavender: '#F0EAFB',
  blush: '#F6DCE8',
  rose: '#E9AFC8',
  cream: '#FFF9F3',
  white: '#FFFFFF',
  ink: '#30283D',
  muted: '#81788D',
  green: '#8EBD9C',
  peach: '#F9D8C2',
  line: '#EAE3F0',
  surface: '#FFFEFD',
  paleGreen: '#EAF3EC',
  palePeach: '#FFF0E7',
} as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30, xxl: 40 } as const;
export const radius = { sm: 12, md: 18, lg: 24, pill: 999 } as const;
export const shadow = {
  card: {
    shadowColor: '#47335E',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2,
  },
} as const;
