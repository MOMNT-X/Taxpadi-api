import { registerAs } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import oauthConfig from './oauth.config';
import aiConfig from './ai.config';

export default [
  appConfig,
  databaseConfig,
  jwtConfig,
  oauthConfig,
  aiConfig,
];


