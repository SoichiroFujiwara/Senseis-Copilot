"use client";

import { useState, useEffect } from "react";



export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    useEffect(
        () => { console.log("ファイルの変更") },
        [files]
    );

    async function handleUpload(files: File[]) {
        setIsUploading(true);
        if (files.length === 0) {
            alert("ファイルが選択されていません");
            return;
        }
        const fd = new FormData();
        for (const f of files) {
            fd.append("files", f);
        }
        //fetchでPOSTリクエストを送る
        try {
            const res = await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: fd,
                }
            );

            if (!res.ok) {
                console.error("HTTPエラー status: ", res.status);
                alert(`アップロードに失敗しました (HTTP ${res.status})`);
                return;
            }

            const data = await res.json();

            if (data.ok) {
                const list: Array<{name: string, size: number, type: string}> = data.files;
                if (list.length > 0) {
                    alert(`アップロード成功！`);
                    console.log('全ファイルの結果:', list);
                } else {
                    console.log(`不明なエラー：filesが空です`)
                }
            } else {
                console.log(`アップロードに失敗しました：${data.error ?? '不明なエラー'}`);
            }
        } catch (err) {
            console.error("例外が発生しました:", err);
            alert("アップロード中にエラーが発生しました（ネットワーク/例外）");
        } finally {
            setIsUploading(false);
        }
    }


    return (
        <div>
            <input
                className="border border-gray-300 hover:bg-gray-100 transition p-1"
                type="file"
                multiple
                onChange={(e) => {
                    const list: FileList | null = e.target.files;
                    const arr: File[] = list ? Array.from(list) : [];
                    setFiles(arr);
                    console.log("選択されたファイル数: ", arr.length);
                }}
            />
            <button
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-400 ml-4 border border-gray-300 transition p-1 rounded-md"
                disabled={files.length === 0 || isUploading}
                onClick={() => {
                    if (files.length === 0) return;
                    handleUpload(files);
                }}>
                {isUploading ? "アップロード中..." : "アップロード"}
            </button>
        </div>
    );
}
