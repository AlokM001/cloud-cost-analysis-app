import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

type DatabaseConnectionState = {
  connected: boolean;
  connection: typeof mongoose | null;
};

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
        failed: boolean;
      }
    | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null, failed: false };
global.mongooseCache = cache;

export async function connectToDatabase(): Promise<DatabaseConnectionState> {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI is not defined. Using in-memory billing data.');
    return { connected: false, connection: null };
  }

  // If we already have a successful connection, return it
  if (cache.conn) {
    return { connected: true, connection: cache.conn };
  }

  // If a previous connection attempt already failed, don't retry
  // (avoids 500ms+ delay on every single API call)
  if (cache.failed) {
    return { connected: false, connection: null };
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
  }

  try {
    cache.conn = await cache.promise;
    console.log('MongoDB connected successfully');
    return { connected: true, connection: cache.conn };
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    cache.failed = true; // Remember the failure so we don't retry
    console.error('MongoDB connection failed. Using in-memory billing data.', error);
    return { connected: false, connection: null };
  }
}
