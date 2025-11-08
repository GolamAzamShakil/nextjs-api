import mongoose from "mongoose";
import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env file');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
  var mongoCache: MongoCache | undefined;
}

let mongooseCached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
let mongoCached: MongoCache = global.mongoCache || { client: null, db: null, promise: null };

// Store caches in global scope for serverless environments
if (!global.mongooseCache) {
  global.mongooseCache = mongooseCached;
}
if (!global.mongoCache) {
  global.mongoCache = mongoCached;
}

async function connectMongoose(): Promise<typeof mongoose> {
  if (mongooseCached.conn) {
    console.log('📦 Using cached Mongoose connection');
    return mongooseCached.conn;
  }

  if (mongooseCached.promise) {
    console.log('⏳ Waiting for existing Mongoose connection...');
    mongooseCached.conn = await mongooseCached.promise;
    return mongooseCached.conn;
  }

  const opts = {
    bufferCommands: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...(DB_NAME && { dbName: DB_NAME }),
  };

  console.log('🔄 Connecting to MongoDB Atlas with Mongoose...');
  
  mongooseCached.promise = mongoose.connect(MONGODB_URI as string, opts)
    .then((mongooseInstance) => {
      console.log('✅ Mongoose connected successfully');
      return mongooseInstance;
    })
    .catch((error) => {
      mongooseCached.promise = null;
      console.error('❌ Mongoose connection error:', error);
      throw error;
    });

  try {
    mongooseCached.conn = await mongooseCached.promise;
  } catch (e) {
    mongooseCached.promise = null;
    throw e;
  }

  return mongooseCached.conn;
}

async function connectMongoNative(): Promise<{ client: MongoClient; db: Db }> {
  if (mongoCached.client && mongoCached.db) {
    console.log('📦 Using cached native MongoDB connection');
    return { client: mongoCached.client, db: mongoCached.db };
  }

  if (mongoCached.promise) {
    console.log('⏳ Waiting for existing native MongoDB connection...');
    const result = await mongoCached.promise;
    mongoCached.client = result.client;
    mongoCached.db = result.db;
    return result;
  }

  const client = new MongoClient(MONGODB_URI as string, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log('🔄 Connecting to MongoDB Atlas with native driver...');
  
  mongoCached.promise = client.connect()
    .then((connectedClient) => {
      console.log('✅ Native MongoDB connected successfully');
      const db = connectedClient.db(DB_NAME);
      return { client: connectedClient, db };
    })
    .catch((error) => {
      mongoCached.promise = null;
      console.error('❌ Native MongoDB connection error:', error);
      throw error;
    });

  try {
    const result = await mongoCached.promise;
    mongoCached.client = result.client;
    mongoCached.db = result.db;
    return result;
  } catch (e) {
    mongoCached.promise = null;
    throw e;
  }
}

// Main connection function that initializes both connections
async function connectDB(): Promise<typeof mongoose> {
  await connectMongoose();
  
  await connectMongoNative();
  
  return mongooseCached.conn as typeof mongoose;
}

// Get Mongoose instance (for existing CRUD operations)
export async function getMongooseConnection() {
  return await connectMongoose();
}

// Get native MongoDB client (for better-auth)
export async function getMongoNativeDb(): Promise<Db> {
  const { db } = await connectMongoNative();
  return db;
}

// Get native MongoDB client and db (for direct operations)
export async function getMongoNativeClient() {
  return await connectMongoNative();
}

// Get MongoDB client from Mongoose (alternative approach)
export async function getMongodbClient() {
  const conn = await connectMongoose();
  return conn.connection.getClient().db(DB_NAME);
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


process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (mongoCached.client) {
    await mongoCached.client.close();
  }
  console.log('🔌 MongoDB connections closed through app termination');
  process.exit(0);
});

export default connectDB;