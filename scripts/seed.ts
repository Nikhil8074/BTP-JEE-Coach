import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { resolve } from 'path';
import 'dotenv/config'; // Load env vars

// Ensure models are registered
import { Subject } from '../models/Subject';
import { Topic } from '../models/Topic';
import { Subtopic } from '../models/Subtopic';

const MONGODB_URI = process.env.MONGODB_URI;

async function processFile(filePath: string, subjectName: string) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    console.log(`Processing ${subjectName} from ${filePath}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Upsert Subject
    let subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
        subject = await Subject.create({ name: subjectName });
    }

    for (const t of data.topics) {
        const topicName = t.topic;
        
        let topic = await Topic.findOne({ name: topicName, subjectId: subject._id });
        if (!topic) {
            topic = await Topic.create({ name: topicName, subjectId: subject._id });
        }

        if (t.subtopics && Array.isArray(t.subtopics)) {
            for (const subName of t.subtopics) {
                let subtopic = await Subtopic.findOne({ name: subName, topicId: topic._id });
                if (!subtopic) {
                    await Subtopic.create({ name: subName, topicId: topic._id });
                }
            }
        }
    }
}

async function main() {
    if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB!");

    await processFile(resolve(__dirname, '../physics.json'), 'Physics');
    await processFile(resolve(__dirname, '../chemistry.json'), 'Chemistry');
    await processFile(resolve(__dirname, '../maths.json'), 'Maths');
    
    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
