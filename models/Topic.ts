import mongoose, { Schema, model, models } from "mongoose";

const TopicSchema = new Schema({
    name: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Ensure uniqueness of name within a specific subject
TopicSchema.index({ name: 1, subjectId: 1 }, { unique: true });

export const Topic = models.Topic || model("Topic", TopicSchema);
