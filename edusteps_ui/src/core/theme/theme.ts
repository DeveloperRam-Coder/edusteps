/**
 * ✨ PROFESSIONAL UNIFIED DESIGN SYSTEM
 * Clean, modern, minimalist UI/UX with professional color palette
 * ONE standard color theme for entire application
 */

export const Colors = {
  // PRIMARY BRAND - BLUE
  primary: '#3B82F6', // Main brand color
  primaryLight: '#60A5FA', // Disabled/inactive
  primaryDark: '#2563EB', // Hover/active
  
  // SECONDARY BRAND - GREEN
  secondary: '#22C55E', // Secondary actions
  secondaryLight: '#4ADE80',
  secondaryDark: '#16A34A', // Secondary hover
  
  // NEUTRAL COLORS - GRAYS
  white: '#ffffff',
  gray50: '#f8f9fa',
  gray100: '#f0f0f0',
  gray200: '#e0e0e0',
  gray300: '#d0d0d0',
  gray400: '#b0b0b0',
  gray500: '#808080',
  gray600: '#666666',
  gray700: '#555555',
  gray800: '#333333',
  gray900: '#212529',
  black: '#000000',
  
  // STATUS COLORS - SEMANTIC
  success: '#28a745', // Green
  error: '#EF4444', // Red
  
  // TEXT COLORS
  text: '#333333', // Primary text
  textSecondary: '#666666', // Secondary text
  textTertiary: '#999999', // Muted text
  textMuted: '#b0b0b0', // Very muted
  
  // BACKGROUNDS
  background: '#ffffff', // Main background
  backgroundSecondary: '#f8f9fa', // Light background
  backgroundTertiary: '#f0f0f0', // Alternative background
  
  // SURFACES
  surface: '#ffffff', // Card background
  surfaceLight: '#f8f9fa', // Light surface
  surfaceHover: '#f0f0f0', // Hover surface
  
  // BORDERS
  border: '#e0e0e0', // Main border
  borderLight: '#d0d0d0', // Light border
  divider: '#e0e0e0', // Divider line
  
  // ROLE COLORS
  admin: '#3B82F6', // Admin - Aligned with new primary blue
  instructor: '#22C55E', // Instructor - Aligned with new secondary green
  user: '#28a745', // User - Success green
};

export const Typography = {
  // Font sizes
  h1: 48,
  h2: 36,
  h3: 30,
  h4: 24,
  h5: 20,
  h6: 18,
  body: 16,
  bodySmall: 14,
  bodyXSmall: 12,
  caption: 11,
  
  // Font weights
  thin: '100' as const,
  extralight: '200' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
  
  // Line heights
  tight: 1.2,
  // normal: 1.5,
  relaxed: 1.75,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 32,
  xl4: 40,
  xl5: 48,
  xl6: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  md: {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
  },
  lg: {
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
  xl: {
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
};

export const Gradients = {
  // No gradients - using solid colors for clean, professional appearance
  // If needed in future, can be added here
};
