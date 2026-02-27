import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db/mongodb.js';
import { env } from './config/env.js';

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
