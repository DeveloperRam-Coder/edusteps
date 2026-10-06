// Path aliases for clean architecture
export const paths = {
  // Core layers
  '@/core/domain': './src/core/domain',
  '@/core/application': './src/core/application', 
  '@/core/infrastructure': './src/core/infrastructure',
  '@/core/presentation': './src/core/presentation',
  
  // UI components
  '@/ui': './src/ui',
  '@/ui/primitives': './src/ui/primitives',
  '@/ui/composites': './src/ui/composites',
  '@/ui/layouts': './src/ui/layouts',
  '@/ui/forms': './src/ui/forms',
  
  // Features
  '@/features': './src/features',
  
  // Shared
  '@/shared': './src/shared',
  
  // Legacy (for gradual migration)
  '@/components': './src/components',
  '@/hooks': './src/hooks',
  '@/lib': './src/lib'
};