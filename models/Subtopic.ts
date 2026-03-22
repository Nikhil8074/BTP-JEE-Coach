import mongoose, { Schema, model, models } from "mongoose";

const SubtopicSchema = new Schema({
    name: { type: String, required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Ensure uniqueness of name within a specific topic
SubtopicSchema.index({ name: 1, topicId: 1 }, { unique: true });

export const Subtopic = models.Subtopic || model("Subtopic", SubtopicSchema);
