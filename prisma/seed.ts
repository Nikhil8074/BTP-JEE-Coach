import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function processFile(filePath: string, subjectName: string) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    console.log(`Processing ${subjectName} from ${filePath}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Upsert Subject
    const subject = await prisma.subject.upsert({
        where: { name: subjectName },
        update: {},
        create: { name: subjectName },
    });

    for (const t of data.topics) {
        const topicName = t.topic;
        const topic = await prisma.topic.upsert({
            where: {
                name_subjectId: {
                    name: topicName,
                    subjectId: subject.id,
                }
            },
            update: {},
            create: {
                name: topicName,
                subjectId: subject.id,
            }
        });

        if (t.subtopics && Array.isArray(t.subtopics)) {
            for (const subName of t.subtopics) {
                await prisma.subtopic.upsert({
                    where: {
                        name_topicId: {
                            name: subName,
                            topicId: topic.id,
                        }
                    },
                    update: {},
                    create: {
                        name: subName,
                        topicId: topic.id,
                    }
                });
            }
        }
    }
}

async function main() {
    await processFile(path.join(__dirname, '../physics.json'), 'Physics');
    await processFile(path.join(__dirname, '../chemistry.json'), 'Chemistry');
    await processFile(path.join(__dirname, '../maths.json'), 'Maths');
    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
