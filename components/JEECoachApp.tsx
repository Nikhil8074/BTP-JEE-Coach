"use client";

import React, { useState, useMemo } from 'react';
import { generateQuestion } from '@/app/actions/generate';
import QuestionCard from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, BrainCircuit, Sparkles } from 'lucide-react';

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
            const result = await generateQuestion({
                subject: selectedSubject.name,
                topic: selectedTopic.name,
                subtopic: selectedSubtopic ? selectedSubtopic.name : selectedTopic.name,
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
        <div className="relative min-h-screen bg-background overflow-x-hidden p-4 py-12 md:p-8 lg:p-12 transition-colors duration-700 font-sans">
            
            {/* Global Space Background Gradient */}
            <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
                <div className="absolute -top-[10%] w-[800px] md:w-[1200px] h-[600px] md:h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-indigo-900/10 to-transparent blur-[100px] opacity-70 animate-in fade-in duration-1000" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4 animate-in slide-in-from-bottom-6 duration-700 pb-4">
                    <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                        <BrainCircuit className="w-10 h-10 text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 drop-shadow-sm pb-2">
                        JEE Coach AI
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Unleash your potential with dynamically synthesized problems spanning Mathematics, Physics, and Advanced Chemistry.
                    </p>
                </div>

                {/* Configuration Glass Panel */}
                <Card className="border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both delay-150">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <CardHeader className="border-b border-white/5 pb-6">
                        <CardTitle className="flex items-center gap-3 text-2xl font-serif text-white/90">
                            <BookOpen className="w-6 h-6 text-violet-400" />
                            Configure Practice Session
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-base">Select a topic to generate a unique practice problem.</CardDescription>
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 pt-8">

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 tracking-wide uppercase shadow-sm">Subject</label>
                            <Select value={selectedSubjectId} onValueChange={(val) => {
                                setSelectedSubjectId(val);
                                setSelectedTopicId("");
                                setSelectedSubtopicId("");
                            }}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:border-violet-500/40 transition-colors h-12 rounded-xl focus:ring-violet-500/50">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white backdrop-blur-xl">
                                    {initialSubjects.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="focus:bg-violet-600/20">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 tracking-wide uppercase shadow-sm">Topic</label>
                            <Select value={selectedTopicId} onValueChange={(val) => {
                                setSelectedTopicId(val);
                                setSelectedSubtopicId("");
                            }} disabled={!selectedSubjectId}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:border-violet-500/40 transition-colors h-12 rounded-xl focus:ring-violet-500/50 disabled:opacity-50">
                                    <SelectValue placeholder="Select Topic" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white backdrop-blur-xl">
                                    {topics.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="focus:bg-violet-600/20">{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 tracking-wide uppercase shadow-sm">Subtopic</label>
                            <Select value={selectedSubtopicId} onValueChange={setSelectedSubtopicId} disabled={!selectedTopicId || subtopics.length === 0}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:border-violet-500/40 transition-colors h-12 rounded-xl focus:ring-violet-500/50 disabled:opacity-50">
                                    <SelectValue placeholder={subtopics.length === 0 ? "No Subtopics" : "Select Subtopic"} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white backdrop-blur-xl">
                                    {subtopics.map(st => (
                                        <SelectItem key={st.id} value={st.id} className="focus:bg-violet-600/20">{st.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-300 tracking-wide uppercase shadow-sm">Difficulty</label>
                            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
                                <SelectTrigger className="bg-black/20 border-white/10 text-white hover:bg-black/40 hover:border-violet-500/40 transition-colors h-12 rounded-xl focus:ring-violet-500/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white backdrop-blur-xl">
                                    <SelectItem value="EASY" className="focus:bg-violet-600/20">Easy Framework</SelectItem>
                                    <SelectItem value="MEDIUM" className="focus:bg-violet-600/20">Standard JEE Main</SelectItem>
                                    <SelectItem value="HARD" className="focus:bg-red-500/20 text-red-300 font-medium">Advanced Brutal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </CardContent>

                    <div className="p-6 pt-2">
                        <Button
                            className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-7 text-xl rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all duration-500 border border-white/10 group disabled:opacity-50 disabled:hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] disabled:cursor-not-allowed"
                            onClick={handleGenerate}
                            disabled={loading || !selectedTopicId}
                        >
                            {/* Animated gleam effect taking over the button */}
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                            
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                    <Loader2 className="h-6 w-6 animate-spin text-white/90" />
                                    <span className="animate-pulse">Generating Problem...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Generate Question
                                </div>
                            )}
                        </Button>
                    </div>
                </Card>

                {/* Output Area */}
                <div className="transition-all duration-700 ease-out flex flex-col items-center w-full">
                    {question && (
                        <div className="animate-in slide-in-from-bottom-12 fade-in duration-700 fill-mode-both w-full">
                            <QuestionCard question={question} onNext={handleGenerate} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
