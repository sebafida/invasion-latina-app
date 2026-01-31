// Invasion Latina Theme - Dark Mode Puerto Rico/Miami Aesthetic

export const theme = {
  colors: {
    // Primary Colors
    primary: '#FF0000',      // Invasion Red
    secondary: '#FFD700',     // Gold Accent
    black: '#000000',         // Deep Black
    
    // Neon Accents
    neonPink: '#FF10F0',
    neonBlue: '#00D4FF',
    neonGreen: '#39FF14',
    
    // Background
    background: '#0A0A0A',
    cardBackground: '#1A1A1A',
    elevated: '#252525',
    
    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#666666',
    
    // Status
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF3B30',
    info: '#00D4FF',
    
    // Transparent
    overlay: 'rgba(0, 0, 0, 0.85)',
    glassMorphism: 'rgba(26, 26, 26, 0.7)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 8,
    },
    neon: {
      shadowColor: '#FF0000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;