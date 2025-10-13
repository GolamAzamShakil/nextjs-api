import mongoose from "mongoose";


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env file');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('📦 Using cached MongoDB connection');
    return cached.conn;
  }

  if (cached.promise) {
    console.log('⏳ Waiting for existing MongoDB connection...');
    cached.conn = await cached.promise;
    return cached.conn;
  }

  const opts = {
    bufferCommands: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    ...(process.env.DB_NAME && { dbName: process.env.DB_NAME }),
  };

  console.log('🔄 Connecting to MongoDB Atlas...');
  
  cached.promise = mongoose.connect(MONGODB_URI as string, opts)    //Non-Null assertion- MONGODB_URI!
    .then((mongooseInstance) => {
      console.log('✅ MongoDB connected successfully');
      return mongooseInstance;
    })
    .catch((error) => {
      cached.promise = null;
      console.error('❌ MongoDB connection error:', error);
      throw error;
    });

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}


mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   console.log('⚠️ MongoDB connection closed due to app termination');
//   process.exit(0);
// });

export default connectDB;