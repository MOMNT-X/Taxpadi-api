import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Frontend URL for OAuth redirects
  frontendUrl: process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://taxgpt.site' 
      : 'http://localhost:3001'),
  // Support multiple frontend origins
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : [
        'http://localhost:3001',
        'https://taxgpt.site',
        'https://www.taxgpt.site',
        'https://taxpadi.vercel.app',
        'https://taxpadi.onrender.com'
      ],
}));


