import { GoogleGenAI, createUserContent, createPartFromUri, GenerateContentResponse } from "@google/genai"
import path from "path";
import { readFile } from "fs/promises";
import schema from "../../../data/scoring/schema.json";

export type Model = "gemini-2.5-pro" | "gemini-2.5-flash"

const RubricJsonPath = path.join(process.cwd(), "data", "rubric", "rubric.json");
const PromptPath = path.join(process.cwd(), "data", "scoring", "prompt.txt");

export type ScoreResponse = {
    results: {
        scores: Array<{ viewpoint_id: number, score: number, reason: string }>,
        overall_description: string,
    },
    errors: { tags: string, description: string },
}

async function buildPrompt() {
    const [template, rubric] = await Promise.all([
        readFile(PromptPath, "utf-8"),
        getRubricTxt(),
    ]);

    // {rubric} を rubric.txt の中身で置換（複数あっても全部）
    const prompt = template.replace(/\{rubric\}/g, rubric.trim());
    return prompt;
}

async function getRubricTxt() {
    const rubric = await readFile(RubricJsonPath, "utf-8");
    const rubricObj = JSON.parse(rubric);
    const rubricTxt = rubricObj.map((item: { name: string, description: string, score: number }, index: number) => `${index + 1} ${item.name}: ${item.description}`).join("\n");
    return rubricTxt;
}

export async function score(filenames: string[], model: Model): Promise<Array<{ filename: string, response: ScoreResponse | null }> | null> {
    const prompt = await buildPrompt();
    console.log(prompt);

    if (!process.env.GEMINI_API_KEY) {
        console.log('[gemini-score] GEMINI_API_KEY is not set');
        return null;
    }
    const ai = new GoogleGenAI({});
    const paths = filenames.map((filename) => path.join(process.cwd(), "upload", "raw", filename));
    const files = [];
    for (const path of paths) {
        const file = await ai.files.upload({
            file: path,
            config: { mimeType: "application/pdf" },
        });
        files.push(file);
    }
    const responses: Array<ScoreResponse | null> = [];

    for (const file of files) {
        if (typeof file.uri === "string" && typeof file.mimeType === "string") {
            const response = await ai.models.generateContent({
                model: model,
                contents: createUserContent([
                    createPartFromUri(file.uri, file.mimeType),
                    prompt,
                ]),
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });
            responses.push(JSON.parse(response.text ?? "{}"));
        } else {
            responses.push(null);
        }
    }
    const results = filenames.map((filename, index) => ({
        filename: filename,
        response: responses[index],
    }));

    return results;
}

