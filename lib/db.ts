import mongoose from "mongoose";

// Define the type for the global mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to the globalThis
declare global {
  var mongoose: MongooseCache | undefined;
}

// Fix connection string issues by handling multiple environment variable locations
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("Missing MongoDB connection string. Please check your environment variables.");
  throw new Error(
    "Please define the MONGODB_URI or MONGO_URI environment variable inside .env.local or .env"
  );
}

// Clean the connection string without using recursion-prone replace
const cleanURI = MONGODB_URI.startsWith("'") || MONGODB_URI.startsWith('"') 
  ? MONGODB_URI.substring(1, MONGODB_URI.length - 1) 
  : MONGODB_URI;

// Safe log that doesn't expose credentials
console.log("Using MongoDB connection string");

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    console.log("Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    };

    console.log("Establishing new MongoDB connection...");
    cached.promise = mongoose.connect(cleanURI, opts).then((mongoose) => {
      console.log("MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }
}

export default connectDB;
export { mongoose };