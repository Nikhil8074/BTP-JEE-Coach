import mongoose, { Schema, model, models } from "mongoose";

const UserHistorySchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    userAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTaken: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

export const UserHistory = models.UserHistory || model("UserHistory", UserHistorySchema);
