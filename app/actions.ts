"use server";

import { prisma } from "@/lib/prisma";

export async function getSubjects() {
    return await prisma.subject.findMany({
        include: {
            topics: {
                include: {
                    subtopics: true,
                },
            },
        },
    });
}
