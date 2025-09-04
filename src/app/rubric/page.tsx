"use client";

import { useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";

export default function Rubric() {
    const [isViewpointsSaved, setIsViewpointsSaved] = useState<boolean>(false);
    const [viewpoints, setViewpoints] = useState<Array<{ name: string, description: string, score: number }>>([]);

    useEffect(() => {
        const fetchViewpoints = async () => {
            const res = await fetch("/api/rubric",
                {
                    method: "GET",
                }
            );
            if (!res.ok) {
                console.error("HTTPエラー status: ", res.status);
                return;
            }
            const data = await res.json();
            console.log(data);
            setViewpoints(data);
        };
        fetchViewpoints();
    }, []);

    function handleAddViewpoint() {
        console.log("観点を追加");
        setViewpoints([...viewpoints, { name: "", description: "", score: 0 }]);
    }

    function handleDeleteViewpoint(i: number) {
        console.log("観点を削除");
        setViewpoints(viewpoints.filter((v, j) => j !== i));
    }

    async function handleSaveViewpoints() {
        const viewpointsScoreTotal = viewpoints.reduce((acc, v) => acc + v.score, 0);
        if (viewpointsScoreTotal !== 100) {
            alert("点数の合計が100点になりません");
            return;
        }
        const fd = new FormData();
        fd.append("viewpoints", JSON.stringify(viewpoints));
        const res = await fetch(
            "/api/rubric",
            {
                method: "POST",
                body: fd,
            }
        );
        if (!res.ok) {
            console.error("HTTPエラー status: ", res.status);
            alert(`観点の保存に失敗しました (HTTP ${res.status})`);
            return;
        }
        setIsViewpointsSaved(true);
    }
    return (
        <div>
            <button
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-400 ml-4 border border-gray-300 transition p-1 rounded-md"
                onClick={() => {
                    handleAddViewpoint();
                }}
            >
                観点を追加
            </button>
            <table className="table-auto border border-gray-300 mt-4">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>観点名</th>
                        <th>観点説明</th>
                        <th>点数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        viewpoints.map((v, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>
                                    <input type="text"
                                        placeholder="観点名"
                                        value={v.name}
                                        onChange={(e) => {
                                            setViewpoints(viewpoints.map((v, j) => j === i ? { ...v, name: e.target.value } : v));
                                        }} />
                                </td>
                                <td>
                                    <TextareaAutosize
                                        placeholder="観点説明"
                                        className="resize-none"
                                        minRows={1}
                                        maxRows={10}
                                        value={v.description}
                                        onChange={(e) => {
                                            setViewpoints(viewpoints.map((v, j) => j === i ? { ...v, description: e.target.value } : v));
                                        }} />
                                </td>
                                <td>
                                    <input type="number"
                                        placeholder="点数"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={v.score}
                                        onChange={(e) => {
                                            if (isNaN(parseInt(e.target.value)) || parseInt(e.target.value) < 0 || parseInt(e.target.value) > 100) {
                                                alert("点数は0~100の間で入力してください");
                                                return;
                                            }
                                            setViewpoints(viewpoints.map((v, j) => j === i ? { ...v, score: parseInt(e.target.value) } : v));
                                        }} />
                                </td>
                                <td>
                                    <button
                                        className="bg-red-100 hover:bg-red-200 active:bg-red-300 disabled:bg-red-400 ml-4 border border-red-300 transition p-1 rounded-md"
                                        onClick={() => {
                                            handleDeleteViewpoint(i);
                                        }}
                                    >
                                        削除
                                    </button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <button
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-400 ml-4 border border-gray-300 transition p-1 rounded-md"
                onClick={() => {
                    handleSaveViewpoints();
                }}
            >
                観点を保存
            </button>
            {isViewpointsSaved && (
                <div>
                    <h2>観点を保存しました</h2>
                </div>
            )}
        </div>
    );
}