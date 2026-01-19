 import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

// If MongoDB URI is not there then throw a error
if (!MONGO_URI) {
  throw new Error(
    'Please define the MONGO_URI environment variable inside .env. Current value is: ' + MONGO_URI
  );
}

// we cached the connection
let cached = global.mongoose;

// if not catch then catch it
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// if already there then no need to open a new connection again otherwise open it
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;