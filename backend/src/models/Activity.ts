import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const activitySchema = new Schema(
    {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["created", "registered"],
        },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    },
    { timestamps: true }
);

activitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Activity = model("Activity", activitySchema);