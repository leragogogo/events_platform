import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const ACTIVITY_TYPES = ["created", "registered"] as const;

const ACTIVITY_TTL_DAYS = 7;

const activitySchema = new Schema(
    {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ACTIVITY_TYPES,
            required: true,
        },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export { ACTIVITY_TTL_DAYS };

activitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Activity = model("Activity", activitySchema);