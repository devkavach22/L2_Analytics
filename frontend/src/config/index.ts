// ============================================
// APP CONFIGURATION
// ============================================

export const CONFIG = {
  BASE_URL: "http://192.168.11.245:5000/api",
  FASTAPI_URL: import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000',
  APP_NAME: 'Kavach',
  VERSION: '1.0.0',
};

export default CONFIG;
