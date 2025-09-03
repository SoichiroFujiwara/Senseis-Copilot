import { GoogleGenAI, createUserContent, createPartFromUri, GenerateContentResponse } from "@google/genai"
import path from "path";
import { readFile } from "fs/promises";
import schema from "../../../data/scoring/schema.json";

export type Model = "gemini-2.5-pro" | "gemini-2.5-flash"

async function buildPrompt({
    templatePath,
    rubricPath,
  }: {
    templatePath: string;
    rubricPath: string;
  }) {
    const [template, rubric] = await Promise.all([
      readFile(templatePath, "utf-8"),
      readFile(rubricPath, "utf-8"),
    ]);
  
    // {rubric} を rubric.txt の中身で置換（複数あっても全部）
    const prompt = template.replace(/\{rubric\}/g, rubric.trim());
    return prompt;
  }

export async function score(filenames: string[], model: Model): Promise<Array<{filename: string, response: GenerateContentResponse | null}> | null> {
    const promptPath = path.join(process.cwd(), "data", "scoring", "prompt.txt");
    const rubricPath = path.join(process.cwd(), "data", "scoring", "rubric.txt");
    const prompt = await buildPrompt({
        templatePath: promptPath,
        rubricPath: rubricPath,
    });
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
    const responses: Array<GenerateContentResponse | null> = [];
    
    for (const file of files) {
        if (typeof file.uri === "string" && typeof file.mimeType === "string")  {
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
            responses.push(response);
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
    
