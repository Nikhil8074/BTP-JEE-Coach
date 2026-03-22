import mongoose, { Schema, model, models } from "mongoose";

const QuestionSchema = new Schema({
    type: { type: String, required: true },
    difficulty: { type: String, required: true },
    questionText: { type: String, required: true },
    // Replacing Prisma String? JSON string with a robust native MongoDB string array
    options: { type: [String], default: undefined }, 
    correctAnswer: { type: String, required: true },
    solution: { type: String, required: true },
    diagramType: { type: String, enum: ["TIKZ", "SMILES", null], default: null },
    diagramContent: { type: String, default: null },
    promptHash: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    subtopicId: { type: Schema.Types.ObjectId, ref: 'Subtopic' },
    createdAt: { type: Date, default: Date.now }
});

export const Question = models.Question || model("Question", QuestionSchema);
