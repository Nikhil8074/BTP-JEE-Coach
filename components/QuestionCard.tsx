"use client";

import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import SmilesRenderer from './SmilesRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
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

    const options: string[] | null = React.useMemo(() => {
        if (!question?.options) return null;
        if (typeof question.options === 'string') {
            try {
                return JSON.parse(question.options);
            } catch (e) {
                console.error("Failed to parse options", e);
                return null;
            }
        }
        return question.options;
    }, [question]);

    const correctAnswers = React.useMemo(() => {
        if (!question?.correctAnswer) return [];
        return question.correctAnswer.split(",").map((s: string) => s.trim().toUpperCase());
    }, [question]);

    const isCorrect = React.useMemo(() => {
        if (!question) return false;
        if (question.type === "SINGLE_MCQ" || question.type === "MCQ") { // Fallback for old questions
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
        <Card className="w-full max-w-3xl mx-auto mt-6 shadow-lg border-2 border-slate-100 dark:border-slate-800">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                        {question.type.replace("_", " ")} • {question.difficulty}
                    </span>
                </div>
                <CardTitle className="text-xl font-serif">
                    <MathRenderer content={question.questionText} />
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Dynamically Render Advanced Diagrams */}
                {question.diagramType === "SMILES" && question.diagramContent && (
                    <SmilesRenderer smiles={question.diagramContent} />
                )}

                {question.diagramType === "TIKZ" && question.diagramContent && (
                    <div className="flex justify-center my-4 p-4 bg-white rounded-lg border-t-4 border-b-4 border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                        {/* React strips script tags dynamically, so we dangerously output the literal script block allowing TikZJax mutation observers to immediately compile it into SVG */}
                        <div dangerouslySetInnerHTML={{ __html: `<script type="text/tikz">${question.diagramContent}</script>` }} />
                    </div>
                )}

                {/* SINGLE_MCQ */}
                {(question.type === "SINGLE_MCQ" || question.type === "MCQ") && options && (
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-3" disabled={isSubmitted}>
                        {options.map((opt: string, idx: number) => {
                            const optionLabel = String.fromCharCode(65 + idx);
                            const isSelected = selectedOption === optionLabel;
                            const isRightAnswer = correctAnswers.includes(optionLabel) || question.correctAnswer === optionLabel;

                            let optionClass = "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800";
                            if (isSubmitted) {
                                if (isRightAnswer) optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                                else if (isSelected && !isRightAnswer) optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                            }

                            return (
                                <div key={idx} className={cn("flex items-center space-x-2 border rounded-lg p-3 transition-colors", optionClass)}>
                                    <RadioGroupItem value={optionLabel} id={`opt-${idx}`} />
                                    <Label htmlFor={`opt-${idx}`} className="flex-grow cursor-pointer flex items-center gap-2 text-base">
                                        <span className="font-bold text-slate-500 w-6">{optionLabel}.</span>
                                        <MathRenderer content={opt} />
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                )}

                {/* MULTI_MCQ */}
                {question.type === "MULTI_MCQ" && options && (
                    <div className="space-y-3">
                        {options.map((opt: string, idx: number) => {
                            const optionLabel = String.fromCharCode(65 + idx);
                            const isSelected = selectedOptions.includes(optionLabel);
                            const isRightAnswer = correctAnswers.includes(optionLabel);

                            let optionClass = "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer";
                            if (isSubmitted) {
                                optionClass = "border-slate-200 dark:border-slate-700 pointer-events-none"; // Remove hover if submitted
                                if (isRightAnswer) optionClass = "border-green-500 bg-green-50 dark:bg-green-900/20 pointer-events-none";
                                else if (isSelected && !isRightAnswer) optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 pointer-events-none";
                            }

                            return (
                                <div 
                                    key={idx} 
                                    className={cn("flex items-center space-x-3 border rounded-lg p-3 transition-colors", optionClass)} 
                                    onClick={() => toggleMultiOption(optionLabel)}
                                >
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 pointer-events-none" 
                                        checked={isSelected}
                                        readOnly
                                    />
                                    <Label className="flex-grow cursor-pointer flex items-center gap-2 text-base pointer-events-none">
                                        <span className="font-bold text-slate-500 w-6">{optionLabel}.</span>
                                        <MathRenderer content={opt} />
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* NUMERICAL (INTEGER/DECIMAL) */}
                {(question.type === "INTEGER" || question.type === "DECIMAL" || question.type === "NUMERICAL") && (
                    <div className="space-y-2">
                        <Label>Your Answer ({question.type.toLowerCase()}):</Label>
                        <Input
                            placeholder={`Enter ${question.type.toLowerCase()} value...`}
                            value={numericalAnswer}
                            onChange={(e) => setNumericalAnswer(e.target.value)}
                            disabled={isSubmitted}
                            className={cn(isSubmitted && (isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"))}
                        />
                    </div>
                )}

                {/* Feedback */}
                {isSubmitted && (
                    <div className={cn("p-4 rounded-lg flex items-center gap-3", isCorrect ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300")}>
                        {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <div>
                            <p className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
                            {!isCorrect && (
                                <p className="text-sm mt-1">
                                    Correct Answer: <span className="font-mono bg-white/50 px-2 py-0.5 rounded dark:bg-black/50">{question.correctAnswer}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Solution */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-300">
                        {showSolution ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showSolution ? "Hide Solution" : "Show Solution"}
                    </Button>
                    {showSolution && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg text-slate-800 dark:bg-slate-900 dark:text-slate-300 border border-amber-200 dark:border-slate-700">
                            <h4 className="font-bold mb-2">Step-by-Step Solution:</h4>
                            <MathRenderer content={question.solution} />
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-6">
                {!isSubmitted ? (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!selectedOption && selectedOptions.length === 0 && !numericalAnswer}
                    >
                        Submit Answer
                    </Button>
                ) : (
                    <Button onClick={onNext}>Next Question</Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default QuestionCard;
