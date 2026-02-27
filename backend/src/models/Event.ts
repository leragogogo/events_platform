import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const EVENT_CATEGORIES = [
    "Music",
    "Tech",
    "Art",
    "Sports",
    "Food",
    "Education",
    "Community",
    "Other"
];

const eventSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: EVENT_CATEGORIES,
            default: "Other",
            required: true
        },
        dateTime: { type: Date, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        coordinates: { type: [Number], required: true },
        capacity: { type: Number, default: 50, min: 1 },
        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export const Event = model("Event", eventSchema);