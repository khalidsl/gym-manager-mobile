export const LightTheme = {
  primary: '#6C63FF',
  secondary: '#4C51BF',
  accent: '#10B981',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gradient: ['#6C63FF', '#4C51BF'] as const,
}

export const DarkTheme = {
  primary: '#7C3AED',
  secondary: '#5B21B6',
  accent: '#10B981',
  background: '#0F172A',
  surface: '#1E293B',
  card: '#334155',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  border: '#475569',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.7)',
  gradient: ['#7C3AED', '#5B21B6'] as const,
}

export const Colors = {
  light: LightTheme,
  dark: DarkTheme,
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
}

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
}

export const GRADIENTS = {
  primary: ['#6C63FF', '#4C51BF'] as const,
  secondary: ['#10B981', '#059669'] as const,
  accent: ['#F59E0B', '#D97706'] as const,
  danger: ['#EF4444', '#DC2626'] as const,
  dark: ['#0F172A', '#1E293B'] as const,
  light: ['#F8FAFC', '#E2E8F0'] as const,
}
