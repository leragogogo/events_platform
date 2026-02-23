import mongoose from "mongoose";

export async function connectDB(uri: string | undefined) {
    if (!uri) throw new Error("MONGODB_URI is missing");
    await mongoose.connect(uri);
    console.log("[db] connected");
}