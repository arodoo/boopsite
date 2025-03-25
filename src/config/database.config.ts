import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_TYPE || 'sqlite',
  database: process.env.DB_PATH || './data/boopsite.db',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: true, // Set to false in production
  logging: false,
}));
