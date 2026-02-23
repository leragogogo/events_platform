import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const registrationSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true }
    },
    { timestamps: true }
);

registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Registration = model("Registration", registrationSchema);