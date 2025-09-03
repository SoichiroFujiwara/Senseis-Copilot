import { writeFile, readFile} from "fs/promises";
import path from "path";



export async function POST(req: Request) {
    const form = await req.formData();
    const viewpointsStr = form.get("viewpoints") as string;
    if (!viewpointsStr) {
        return Response.json({ ok: false, error: "viewpointsが見つかりませんでした" }, { status: 400 });
    }
    const filePath = path.join(process.cwd(), "data", "rubric", "rubric.json");
    await writeFile(filePath, viewpointsStr);
    return Response.json({ ok: true}, { status: 200 });
}

export async function GET(): Promise<Response> {
    const filePath = path.join(process.cwd(), "data", "rubric", "rubric.json");
    const contentStr = await readFile(filePath, "utf-8");
    const content = JSON.parse(contentStr);
    return Response.json(content , { status: 200 });
}