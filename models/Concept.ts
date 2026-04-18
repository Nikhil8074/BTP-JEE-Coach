import mongoose, { Schema, model, models } from "mongoose";

const ConceptSchema = new Schema({
    content: { type: String, required: true },
    difficulty: { type: String, required: true },
    diagramType: { type: String, enum: ["TIKZ", "SMILES", null], default: null },
    diagramContent: { type: String, default: null },
    promptHash: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    subtopicId: { type: Schema.Types.ObjectId, ref: 'Subtopic' },
    createdAt: { type: Date, default: Date.now }
});

export const Concept = models.Concept || model("Concept", ConceptSchema);
