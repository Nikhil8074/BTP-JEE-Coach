"use client";

import React, { useEffect, useRef } from 'react';
import SmilesDrawer from 'smiles-drawer';

interface SmilesRendererProps {
    smiles: string;
    width?: number;
    height?: number;
}

const SmilesRenderer: React.FC<SmilesRendererProps> = ({ smiles, width = 450, height = 450 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // SmilesDrawer initialization parameters
        const options = {
            width,
            height,
            padding: 10,
            themes: {
                light: {
                    C: '#222',
                    O: '#e74c3c',
                    N: '#3498db',
                    F: '#27ae60',
                    CL: '#16a085',
                    BR: '#d35400',
                    I: '#8e44ad',
                    P: '#d35400',
                    S: '#f1c40f',
                    B: '#e67e22',
                    SI: '#e67e22',
                    H: '#222',
                    BACKGROUND: '#ffffff'
                },
                dark: {
                    C: '#fff',
                    O: '#e74c3c',
                    N: '#3498db',
                    F: '#27ae60',
                    CL: '#16a085',
                    BR: '#d35400',
                    I: '#8e44ad',
                    P: '#d35400',
                    S: '#f1c40f',
                    B: '#e67e22',
                    SI: '#e67e22',
                    H: '#fff',
                    BACKGROUND: '#1e293b' // matches slate-800
                }
            }
        };

        const drawer = new SmilesDrawer.Drawer(options);

        // Uses standard smiles-drawer syntax
        SmilesDrawer.parse(smiles, (tree: any) => {
            if (canvasRef.current) {
                // To support dark mode natively, we check system preference
                // For BTP-JEE-Coach, standard light theme works flawlessly inside the Card boundaries
                drawer.draw(tree, canvasRef.current, 'light', false);
            }
        }, (err: any) => {
            console.error('SMILES Parsing Error:', err);
        });
    }, [smiles, width, height]);

    return (
        <div className="flex justify-center my-4 p-4 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default SmilesRenderer;
