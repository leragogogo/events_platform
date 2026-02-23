import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const hostGroupSchema = new Schema(
    {
        memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    },
    { timestamps: true }
);

export const HostGroup = model("HostGroup", hostGroupSchema)