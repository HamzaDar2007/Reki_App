import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultCity: process.env.DEFAULT_CITY || 'Manchester',
  defaultLat: parseFloat(process.env.DEFAULT_LAT) || 53.4808,
  defaultLng: parseFloat(process.env.DEFAULT_LNG) || -2.2426,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  weatherApiKey: process.env.WEATHER_API_KEY,
}));
