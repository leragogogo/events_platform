import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const connectionSchema = new Schema(
    {
        requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        addresseId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["pending", "approved", "declined"],
            default: "pending"
        },
        userLowId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        userHighId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    },
    { timestamps: true }
);

connectionSchema.index({ userLowId: 1, userHighId: 1 }, { unique: true });

export const Connection = model("Connection", connectionSchema);