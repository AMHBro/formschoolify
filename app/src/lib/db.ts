import mongoose from "mongoose";

type GlobalWithMongoose = typeof globalThis & {
  mongooseConn?: Promise<typeof mongoose>;
};

const globalForMongoose = globalThis as GlobalWithMongoose;

export function connectDb() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set.");
  }
  if (!globalForMongoose.mongooseConn) {
    globalForMongoose.mongooseConn = mongoose.connect(MONGODB_URI);
  }
  return globalForMongoose.mongooseConn;
}

