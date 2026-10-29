export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'Sistema de Contrataciones',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
} as const;
