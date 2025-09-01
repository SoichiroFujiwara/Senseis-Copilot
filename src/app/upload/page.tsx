"use client";

import { useState, useEffect } from "react";



export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    useEffect(
        () => {console.log("ファイルが変更された：", file?.name ?? "（なし）")},
        [file]
    );

    
    return (
        <div>
            <input 
            className="border border-gray-300 hover:bg-gray-100 transition p-1"
            type="file"
            onChange={(e)=>{
                const f = e.target.files?.[0] ?? null;
                setFile(f);}}
             />
             <button
             className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-400 ml-4 border border-gray-300 transition p-1 rounded-md"
             disabled={file == null}
             onClick={()=>{
                if (!file) return;
                handleMakeFormData(file);
                alert(`FormDataに詰めました: ${file.name}`);
             }}>
                アップロード
             </button>
        </div>
    );
}

function handleMakeFormData(file: File) {
    const fd = new FormData();
    fd.append("file", file);

    //中身を確認用にログ（実運用では不要）
    for (const [key, value] of fd.entries()) {
        if (value instanceof File) {
            console.log('FormData:', key, value.name, value.size, 'bytes');
        } else {
            console.log('FormData:', key, value);
        }
    }
}