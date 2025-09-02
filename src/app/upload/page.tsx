"use client";

import { useState, useEffect } from "react";



export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    useEffect(
        () => { console.log("ファイルが変更された：", files[0]?.name ?? "（なし）") },
        [files]
    );

    async function handleUpload(files: File[]) {
        setIsUploading(true);
        if (files.length === 0) return;
        const fd = new FormData();
        fd.append("file", files[0]);
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
                alert(`アップロード成功！\nname: ${data.name}\nsize: ${data.size} bytes\ntype: ${data.type}`);
                console.log('サーバーからの返事:', data);

            } else {
                const msg = data.error ?? '不明なエラー';
                alert(`アップロードに失敗しました：${msg}`);
                console.warn('サーバーからのエラー:', data);
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
                    if (arr[0]) {
                        console.log("代表ファイル: ", arr[0].name, arr[0].size, "bytes", arr[0].type);
                    }
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
