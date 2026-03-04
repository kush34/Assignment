import mongoose from "mongoose";
import { error } from "node:console";

const connectDB = async () => {
  try {
    const uri = process.env.MongoDb_URI
    if (!uri) throw new Error("MONGO_URI is missing in environment variables"); const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error) {
      console.error(error.message);
    } else {
      console.error("Unknown error", error);
    }
  }
};

export default connectDB;