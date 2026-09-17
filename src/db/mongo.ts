import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the_last_plate_db';

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log('MongoDB successfully connected to:', MONGODB_URI);
    return true;
  } catch (error: any) {
    console.warn('MongoDB connection deferred or offline. Operating with graceful API state handler:', error?.message);
    return false;
  }
}
