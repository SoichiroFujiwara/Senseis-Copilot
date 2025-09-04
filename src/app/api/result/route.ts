import { score, ScoreResponse } from "@/lib/genai/score";
import { glob } from "glob";
import path from "path";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
    console.log("採点開始");
    const filepaths = await glob("upload/raw/*.pdf");
    const filenames = filepaths.map((filepath) => path.basename(filepath));
    const results: Array<{filename: string, response: ScoreResponse | null}> | null = await score(filenames, "gemini-2.5-pro");
    console.log("採点結果: ", results);
    if (results) {
        console.log("採点成功");
        return Response.json(results, { status: 200 });
    } else {
        console.log("採点に失敗しました");
        return Response.json({ error: "採点に失敗しました"}, { status: 500 });
    }
}