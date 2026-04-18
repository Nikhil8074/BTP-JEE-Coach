"use client";

import React from 'react';
import MathRenderer from './MathRenderer';
import SmilesRenderer from './SmilesRenderer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface ConceptCardProps {
    concept: any;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept }) => {
    if (!concept) return null;

    return (
        <Card className="w-full relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl group">
            
            {/* Ambient Card Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none" />
            
            <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    <span className="bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Concept Explanation
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
                
                {/* Dynamically Render Advanced Diagrams */}
                {concept.diagramType === "SMILES" && concept.diagramContent && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <SmilesRenderer smiles={concept.diagramContent} />
                    </div>
                )}

                {concept.diagramType === "TIKZ" && concept.diagramContent && (
                    <div className="flex justify-center my-6 p-6 bg-white rounded-xl border-t-4 border-fuchsia-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
                        <div dangerouslySetInnerHTML={{ __html: `<script type="text/tikz">${concept.diagramContent}</script>` }} />
                    </div>
                )}

                <div className="p-2 md:p-6 bg-transparent rounded-xl text-slate-800 dark:text-white/90 prose prose-slate dark:prose-invert prose-lg max-w-none animate-in fade-in slide-in-from-top-4 duration-500">
                    <MathRenderer content={concept.content} />
                </div>
            </CardContent>
        </Card>
    );
};

export default ConceptCard;
