import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log(`Successfully connected to mongoDB 🥂`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    // process.exit(1);
  }
};

export default connectDB;

// For singleton pattern
const globalForMongoose = global as unknown as {
  mongoose: {
    conn: null | typeof mongoose;
    promise: null | Promise<typeof mongoose>;
  };
};

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = { conn: null, promise: null };
}

export { mongoose };