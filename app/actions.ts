"use server";

import dbConnect from "@/lib/mongodb";
import { Subject } from "@/models/Subject";
import { Topic } from "@/models/Topic";
import { Subtopic } from "@/models/Subtopic";

export async function getSubjects() {
    await dbConnect();
    
    // Fetch all documents as lean Javascript objects
    const subjects = await Subject.find({}).lean();
    const topics = await Topic.find({}).lean();
    const subtopics = await Subtopic.find({}).lean();

    // Map them into the nested structural array identical to the original Prisma payload
    // This perfectly bridges relational graphing into MongoDB document arrays 
    // and correctly serializes native ObjectIds into Strings for the Next.js Client Boundary
    return subjects.map((subject: any) => ({
        id: subject._id.toString(),
        name: subject.name,
        topics: topics
            .filter((t: any) => t.subjectId.toString() === subject._id.toString())
            .map((topic: any) => ({
                id: topic._id.toString(),
                name: topic.name,
                subtopics: subtopics
                    .filter((s: any) => s.topicId.toString() === topic._id.toString())
                    .map((subtopic: any) => ({
                        id: subtopic._id.toString(),
                        name: subtopic.name
                    }))
            }))
    }));
}
