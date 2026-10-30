export const env = {
  // Cambia el fallback a '/api'
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'Sistema de Contrataciones',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
} as const;