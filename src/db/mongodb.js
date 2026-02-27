import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;

/**
 * MongoDB connection singleton.
 * Connects once and reuses the connection.
 */
export const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
