"use client";

import React, { useState, useMemo } from 'react';
import { getSubjects } from '@/app/actions';
import { generateQuestion } from '@/app/actions/generate';
import QuestionCard from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, BrainCircuit } from 'lucide-react';

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Subject {
    id: string;
    name: string;
    topics: Topic[];
}

interface Topic {
    id: string;
    name: string;
    subtopics: Subtopic[];
}

interface Subtopic {
    id: string;
    name: string;
}

interface JEECoachAppProps {
    initialSubjects: Subject[];
}

export default function JEECoachApp({ initialSubjects }: JEECoachAppProps) {
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");
    const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>("");
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState<any>(null);

    // Derived state for dependent dropdowns
    const selectedSubject = useMemo(() =>
        initialSubjects.find(s => s.id === selectedSubjectId),
        [initialSubjects, selectedSubjectId]);

    const topics = useMemo(() => selectedSubject?.topics || [], [selectedSubject]);

    const selectedTopic = useMemo(() =>
        topics.find(t => t.id === selectedTopicId),
        [topics, selectedTopicId]);

    const subtopics = useMemo(() => selectedTopic?.subtopics || [], [selectedTopic]);

    const selectedSubtopic = useMemo(() =>
        subtopics.find(st => st.id === selectedSubtopicId),
        [subtopics, selectedSubtopicId]);


    const handleGenerate = async () => {
        if (!selectedSubject || !selectedTopic) return;

        setLoading(true);
        setQuestion(null);

        try {
            console.log("Client requesting generation for:", {
                subject: selectedSubject.name,
                topic: selectedTopic.name,
                subtopic: selectedSubtopic ? selectedSubtopic.name : "None"
            });
            const result = await generateQuestion({
                subject: selectedSubject.name,
                topic: selectedTopic.name,
                subtopic: selectedSubtopic ? selectedSubtopic.name : selectedTopic.name, // Fallback to topic name if no subtopic
                difficulty: difficulty,
            });
            setQuestion(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate question. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-3">
                        <BrainCircuit className="w-10 h-10 text-indigo-600" />
                        JEE Coach AI
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Master Physics, Chemistry, and Maths with AI-generated problems.
                    </p>
                </div>

                {/* Selection Card */}
                <Card className="border-t-4 border-t-indigo-600 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Configure Practice Session
                        </CardTitle>
                        <CardDescription>Select a topic to generate a unique problem.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Select value={selectedSubjectId} onValueChange={(val) => {
                                setSelectedSubjectId(val);
                                setSelectedTopicId("");
                                setSelectedSubtopicId("");
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {initialSubjects.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Topic</label>
                            <Select value={selectedTopicId} onValueChange={(val) => {
                                setSelectedTopicId(val);
                                setSelectedSubtopicId("");
                            }} disabled={!selectedSubjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Topic" />
                                </SelectTrigger>
                                <SelectContent>
                                    {topics.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subtopic</label>
                            <Select value={selectedSubtopicId} onValueChange={setSelectedSubtopicId} disabled={!selectedTopicId || subtopics.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={subtopics.length === 0 ? "No Subtopics" : "Select Subtopic"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subtopics.map(st => (
                                        <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Difficulty</label>
                            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">Easy</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HARD">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </CardContent>

                    <div className="p-6 pt-0">
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                            onClick={handleGenerate}
                            disabled={loading || !selectedTopicId}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Generating Problem...
                                </>
                            ) : (
                                "Generate Question"
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Output Area */}
                <div className="transition-all duration-500 ease-in-out">
                    {question && <QuestionCard question={question} onNext={handleGenerate} />}
                </div>

            </div>
        </div>
    );
}
