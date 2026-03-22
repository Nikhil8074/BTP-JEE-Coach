"use client";

import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import SmilesRenderer from './SmilesRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Eye, EyeOff, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
    question: any;
    onNext?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onNext }) => {
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [numericalAnswer, setNumericalAnswer] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);

    const options: string[] | null = React.useMemo(() => {
        if (!question?.options) return null;
        if (typeof question.options === 'string') {
            try { return JSON.parse(question.options); } 
            catch { return null; }
        }
        return question.options;
    }, [question]);

    const correctAnswers = React.useMemo(() => {
        if (!question?.correctAnswer) return [];
        return question.correctAnswer.split(",").map((s: string) => s.trim().toUpperCase());
    }, [question]);

    const isCorrect = React.useMemo(() => {
        if (!question) return false;
        if (question.type === "SINGLE_MCQ" || question.type === "MCQ") {
            return selectedOption === correctAnswers[0] || selectedOption === question.correctAnswer;
        } else if (question.type === "MULTI_MCQ") {
            const sortedSelected = [...selectedOptions].sort();
            const sortedCorrect = [...correctAnswers].sort();
            return sortedSelected.length === sortedCorrect.length && 
                   sortedSelected.every((val, index) => val === sortedCorrect[index]);
        } else {
            return numericalAnswer.trim() === question.correctAnswer.trim();
        }
    }, [question, selectedOption, selectedOptions, numericalAnswer, correctAnswers]);

    const handleSubmit = () => {
        setIsSubmitted(true);
        setShowSolution(true);
    };

    const handleReveal = () => {
        setHasRevealed(true);
        setIsSubmitted(true);
        setShowSolution(true);
    };

    const toggleMultiOption = (optionLabel: string) => {
        if (isSubmitted) return;
        setSelectedOptions(prev => 
            prev.includes(optionLabel) 
                ? prev.filter(l => l !== optionLabel)
                : [...prev, optionLabel]
        );
    };

    if (!question) return null;

    return (
        <Card className="w-full relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl group">
            
            {/* Ambient Card Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
            
            <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                        {question.type.replace("_", " ")} • {question.difficulty}
                    </span>
                    {question.difficulty === "HARD" && (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-widest">
                            <AlertTriangle className="w-4 h-4" /> Extreme
                        </span>
                    )}
                </div>
                <CardTitle className="text-xl md:text-2xl font-serif leading-relaxed text-slate-900 dark:text-white/95 tracking-wide">
                    <MathRenderer content={question.questionText} />
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
                
                {/* Dynamically Render Advanced Diagrams */}
                {question.diagramType === "SMILES" && question.diagramContent && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <SmilesRenderer smiles={question.diagramContent} />
                    </div>
                )}

                {question.diagramType === "TIKZ" && question.diagramContent && (
                    <div className="flex justify-center my-6 p-6 bg-white rounded-xl border-t-4 border-violet-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
                        <div dangerouslySetInnerHTML={{ __html: `<script type="text/tikz">${question.diagramContent}</script>` }} />
                    </div>
                )}

                {(question.type === "SINGLE_MCQ" || question.type === "MCQ") && options && (
                    <RadioGroup 
                        value={selectedOption} 
                        onValueChange={setSelectedOption} 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        disabled={isSubmitted}
                    >
                        {options.map((option, idx) => {
                            const label = String.fromCharCode(65 + idx);
                            const isSelected = selectedOption === label;
                            
                            return (
                                <div key={idx} className="relative group">
                                    <RadioGroupItem value={label} id={`option-${idx}`} className="sr-only" />
                                    <Label
                                        htmlFor={`option-${idx}`}
                                        className={cn(
                                            "flex items-center p-5 rounded-xl border cursor-pointer transition-all duration-300 select-none",
                                            isSelected 
                                                ? "bg-violet-600/20 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/50" 
                                                : "bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-4 text-sm font-bold transition-colors",
                                            isSelected ? "bg-violet-500 text-white" : "bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/50 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                                        )}>
                                            {label}
                                        </div>
                                        <div className="text-lg text-slate-800 dark:text-white/90">
                                            <MathRenderer content={option} />
                                        </div>
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                )}

                {question.type === "MULTI_MCQ" && options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {options.map((option, idx) => {
                            const label = String.fromCharCode(65 + idx);
                            const isSelected = selectedOptions.includes(label);

                            return (
                                <div 
                                    key={idx}
                                    onClick={() => toggleMultiOption(label)}
                                    className={cn(
                                        "flex items-center p-5 rounded-xl border cursor-pointer transition-all duration-300 select-none",
                                        isSelected 
                                            ? "bg-violet-600/20 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/50" 
                                            : "bg-black/5 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10 opacity-90",
                                        isSubmitted && "cursor-default opacity-80"
                                    )}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md mr-4 text-sm font-bold transition-all",
                                        isSelected ? "bg-violet-500 text-white shadow-inner" : "bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/50 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                                    )}>
                                        {label}
                                    </div>
                                    <div className="text-lg text-slate-800 dark:text-white/90">
                                        <MathRenderer content={option} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(question.type === "INTEGER" || question.type === "DECIMAL") && (
                    <div className="space-y-4 max-w-sm mx-auto">
                        <Label htmlFor="numerical-answer" className="text-slate-500 dark:text-white/70 uppercase tracking-widest text-xs font-bold text-center block mb-4">Enter Numerical Answer</Label>
                        <Input 
                            id="numerical-answer"
                            type="text" 
                            placeholder={question.type === "INTEGER" ? "e.g., 42" : "e.g., 3.14"} 
                            value={numericalAnswer}
                            onChange={(e) => setNumericalAnswer(e.target.value)}
                            disabled={isSubmitted}
                            className="text-center text-3xl p-8 bg-black/5 dark:bg-black/30 border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus-visible:ring-violet-500/50 rounded-xl font-mono shadow-inner"
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-6 pt-2 pb-8 bg-white/5 border-t border-white/5">
                
                {!isSubmitted ? (
                    <div className="flex flex-col md:flex-row gap-4 justify-center md:items-center w-full">
                        <Button 
                            onClick={handleSubmit} 
                            className="w-full md:w-auto min-w-[250px] bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-white/90 font-bold py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all"
                            disabled={
                                (!selectedOption && (question.type === "SINGLE_MCQ" || question.type === "MCQ")) ||
                                (selectedOptions.length === 0 && question.type === "MULTI_MCQ") ||
                                (!numericalAnswer && (question.type === "INTEGER" || question.type === "DECIMAL"))
                            }
                        >
                            Submit Answer
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleReveal}
                            className="w-full md:w-auto text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-bold py-6 px-8 rounded-xl transition-all"
                        >
                            Reveal Solution
                        </Button>
                    </div>
                ) : (
                    <div className="w-full space-y-6 animate-in slide-in-from-top-4 duration-500">
                        {/* Status Alert Banner */}
                        <div className={cn(
                            "flex items-center justify-center gap-3 p-6 rounded-xl border border-black/5 dark:border-white/10 shadow-lg text-xl font-bold tracking-wide backdrop-blur-md",
                            hasRevealed ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : 
                            isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        )}>
                            {hasRevealed ? <Eye className="w-8 h-8" /> : isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            {hasRevealed ? "Solution Revealed" : isCorrect ? "Correct!" : "Incorrect"}
                        </div>

                        {/* Truth Value Banner */}
                        {!isCorrect && !hasRevealed && (
                            <div className="p-5 bg-black/5 dark:bg-black/40 rounded-xl border border-black/10 dark:border-white/5 flex flex-col md:flex-row items-center justify-center gap-4">
                                <span className="text-slate-500 dark:text-white/50 text-sm font-semibold uppercase tracking-widest">Correct Answer:</span>
                                <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white bg-black/5 dark:bg-white/10 px-4 py-1 rounded-md">
                                    {question.correctAnswer}
                                </span>
                            </div>
                        )}
                        {hasRevealed && (
                            <div className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col md:flex-row items-center justify-center gap-4">
                                <span className="text-amber-700/60 dark:text-amber-300/50 text-sm font-semibold uppercase tracking-widest">Correct Answer:</span>
                                <span className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-4 py-1 rounded-md">
                                    {question.correctAnswer}
                                </span>
                            </div>
                        )}

                        {/* Evaluative Solution Block */}
                        <div className="pt-4 space-y-4">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowSolution(!showSolution)}
                                className="w-full bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white font-bold py-6 rounded-xl transition-all"
                            >
                                {showSolution ? <EyeOff className="w-5 h-5 mr-3" /> : <Eye className="w-5 h-5 mr-3" />}
                                {showSolution ? "Hide Solution" : "Show Solution"}
                            </Button>
                            
                            {showSolution && (
                                <div className="p-6 md:p-8 bg-white dark:bg-black/40 rounded-xl border text-slate-800 dark:text-white/90 border-black/10 dark:border-white/5 prose prose-slate dark:prose-invert prose-lg max-w-none shadow-inner animate-in fade-in slide-in-from-top-4 duration-500">
                                    <MathRenderer content={question.solution} />
                                </div>
                            )}

                            {onNext && (
                                <Button 
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-7 mt-6 text-xl rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all border border-white/10"
                                    onClick={onNext}
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate Next Question
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default QuestionCard;
