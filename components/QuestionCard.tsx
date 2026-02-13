"use client";

import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
    question: any; // Type strictly later
    onNext?: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onNext }) => {
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [numericalAnswer, setNumericalAnswer] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSolution, setShowSolution] = useState(false);

    if (!question) return null;

    const options = React.useMemo(() => {
        if (!question.options) return null;
        if (typeof question.options === 'string') {
            try {
                return JSON.parse(question.options);
            } catch (e) {
                console.error("Failed to parse options", e);
                return null;
            }
        }
        return question.options;
    }, [question.options]);
    // Find the correct option label (A, B, C, D)
    const correctOptionLabel = React.useMemo(() => {
        if (question.type !== "MCQ" || !options) return question.correctAnswer;

        // Case 1: correctAnswer is already a label "A", "B", "C", "D"
        if (["A", "B", "C", "D"].includes(question.correctAnswer)) {
            return question.correctAnswer;
        }

        // Case 2: correctAnswer is the text value -> Find matching index
        const index = options.findIndex((opt: string) => opt.trim() === question.correctAnswer.trim());
        if (index !== -1) return String.fromCharCode(65 + index);

        return question.correctAnswer; // Fallback
    }, [question.correctAnswer, options, question.type]);

    const isCorrect =
        question.type === "MCQ"
            ? selectedOption === correctOptionLabel
            : numericalAnswer.trim() === question.correctAnswer.trim();

    const handleSubmit = () => {
        setIsSubmitted(true);
        setShowSolution(true);
    };

    return (
        <Card className="w-full max-w-3xl mx-auto mt-6 shadow-lg border-2 border-slate-100 dark:border-slate-800">
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                        {question.type} • {question.difficulty}
                    </span>
                    {/* <span className="text-sm text-slate-500">ID: {question.id.slice(-6)}</span> */}
                </div>
                <CardTitle className="text-xl font-serif">
                    <MathRenderer content={question.questionText} />
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* SVG Diagram Rendering */}
                {question.diagrams && (
                    <div className="flex justify-center my-4 p-4 bg-white rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <div dangerouslySetInnerHTML={{ __html: question.diagrams }} className="w-full max-w-md" />
                    </div>
                )}

                {/* Options / Input */}
                {question.type === "MCQ" && options ? (
                    <RadioGroup
                        value={selectedOption}
                        onValueChange={setSelectedOption}
                        className="space-y-3"
                        disabled={isSubmitted}
                    >
                        {options.map((opt: string, idx: number) => {
                            const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                            const isSelected = selectedOption === optionLabel;
                            const isRightAnswer = correctOptionLabel === optionLabel;

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
                ) : (
                    <div className="space-y-2">
                        <Label>Your Answer:</Label>
                        <Input
                            placeholder="Enter numerical value..."
                            value={numericalAnswer}
                            onChange={(e) => setNumericalAnswer(e.target.value)}
                            disabled={isSubmitted}
                            className={cn(isSubmitted && (isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"))}
                        />
                    </div>
                )}

                {/* Feedback Area */}
                {isSubmitted && (
                    <div className={cn("p-4 rounded-lg flex items-center gap-3", isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                        {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        <div>
                            <p className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
                            <p className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
                            {!isCorrect && <p className="text-sm">Correct Answer: {correctOptionLabel} {question.type === "MCQ" && options ? `(${options[correctOptionLabel.charCodeAt(0) - 65]})` : ''} </p>}
                        </div>
                    </div>
                )}

                {/* Solution Toggle */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSolution(!showSolution)}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        {showSolution ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showSolution ? "Hide Solution" : "Show Solution"}
                    </Button>

                    {showSolution && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                            <h4 className="font-bold mb-2 text-amber-800 dark:text-amber-500">Step-by-Step Solution:</h4>
                            <MathRenderer content={question.solution} />
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-6">
                {!isSubmitted ? (
                    <Button onClick={handleSubmit} disabled={!selectedOption && !numericalAnswer}>Submit Answer</Button>
                ) : (
                    <Button onClick={onNext}>Next Question</Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default QuestionCard;
