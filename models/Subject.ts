import mongoose, { Schema, model, models } from "mongoose";

const SubjectSchema = new Schema({
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

export const Subject = models.Subject || model("Subject", SubjectSchema);
