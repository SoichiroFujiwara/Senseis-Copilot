"use client";

import {glob} from "glob";
import path from "path";
import {score} from "@/lib/genai/score";
import { useState, useEffect } from "react";
import { ScoreResponse } from "@/lib/genai/score";

export default function ResultPage() {
    const [result, setResult] = useState<Array<{filename: string, response: ScoreResponse | null}> | null>(null);
    const [viewpoints, setViewpoints] = useState<Array<{name: string, description: string, score: number}>>([]);
    useEffect(() => {
        const fetchViewpoints = async () => {
            const res = await fetch("/api/rubric", {
                method: "GET",
            });
            const data = await res.json();
            setViewpoints(data);
        };
        fetchViewpoints();
    }, []);

    function getTotalScore(scoresobj: Array<{viewpoint_id: number, score: number, reason: string}>) {
        const weights = getWeights(viewpoints);
        const scores = scoresobj.map((s) => s.score);
        return weights.reduce((acc, weight, index) => acc + weight * scores[index], 0);
    }
    function getWeights(viewpoints: Array<{name: string, description: string, score: number}>) {
        return viewpoints.map((v) => v.score / 100);
    }

 
    async function handleScore() {
        const res = await fetch(
            "/api/result",
            {
                method: "GET",
            }
        );
        if (!res.ok) {
            console.error("HTTPエラー status: ", res.status);
            alert(`採点に失敗しました (HTTP ${res.status})`);
            return;
        }
        const data = await res.json();
        setResult(data);
    }

    return (
        <div>
            <button
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-400 ml-4 border border-gray-300 transition p-1 rounded-md"
                onClick={() => {
                    handleScore();
                }}
            >
                採点する
            </button>
            <table>
                <thead>
                    <tr>
                        <th>ファイル名</th>
                        <th>総合得点</th>
                        <th>総括</th>
                        <th>要確認</th>
                    </tr>
                </thead>
                <tbody>
                    {result?.map((r, i) => (
                        <tr key={r.filename}>
                            <td>{r.filename}</td>
                            <td>{getTotalScore(r.response?.results?.scores ?? [])}</td>
                            <td>{r.response?.results?.overall_description}</td>
                            <td>{r.response?.errors ? "〇" : ""}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}