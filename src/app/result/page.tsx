"use client";

import {glob} from "glob";
import path from "path";
import {score} from "@/lib/genai/score";
import { useState } from "react";
import { GenerateContentResponse } from "@google/genai";

export default function ResultPage() {
    const [result, setResult] = useState<Array<{filename: string, response: GenerateContentResponse | null}> | null>(null);

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
        </div>
    );
}