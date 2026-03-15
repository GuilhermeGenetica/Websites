const isDev = import.meta.env.DEV

const baseApiUrl = import.meta.env.VITE_API_URL || (isDev ? '/api' : '/api');
const cleanApiUrl = baseApiUrl.replace(/\/+$/, '');

const devApiUrl = isDev ? '/api' : cleanApiUrl;

const config = {
  API_URL: devApiUrl,
  SITE_URL: import.meta.env.VITE_SITE_URL || 'https://guilherme.onnetweb.com',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Guilherme WorkBench',
  STRIPE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  UPLOAD_PATH: '/uploads',
  FILEXPLORER_PATH: '/filexplorer',
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
  SESSION_TIMEOUT: 3600000,
  SUPPORTED_LANGUAGES: ['en', 'pt', 'it'],
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_THEME: 'dark',
  WALLPAPER_DEFAULT: '/wallpapers/default.jpg',
}

export default config

export const API_URL = devApiUrl;

export const SITE_NAME = 'Dr. Guilherme de Macedo Oliveira';
export const SITE_URL = 'https://guilherme.onnetweb.com';
export const BLOG_NAME = 'GuideLines';

export const VERSION = '2.0.0';

export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER';