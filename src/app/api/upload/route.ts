import { mkdir, writeFile, rm, stat } from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function GET(): Promise<Response> {
    //return the list of filename and size
    const target = path.join(process.cwd(), "upload", "raw");
    const filePaths = await glob(path.join(target, "*.pdf"));
    const content = await Promise.all(
        filePaths.map(async filePath => ({
            filename: path.basename(filePath),
            size: (await stat(filePath)).size,
        }))
    );
    return Response.json(content, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
    async function clearRaw() {
        const target = path.join(process.cwd(), "upload", "raw");
        await rm(target, { recursive: true, force: true });
        console.log("upload/raw 配下を削除しました");
      }

    console.log("アップロード開始");
    const form: FormData = await req.formData();
    const files: File[] = form.getAll("files").filter((v): v is File => v instanceof File);
    const uploadDir = path.join(process.cwd(), 'upload', 'raw');
    await mkdir(uploadDir, { recursive: true });

    try {
        await clearRaw();
        for (const file of files) {
            const safeName = file.name.replace(/[\/\\]/g, '_');
            const filePath = path.join(uploadDir, safeName);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await mkdir(uploadDir, { recursive: true });
            await writeFile(filePath, buffer);
        }
    } catch (err) {
        console.error('[upload] ファイルの保存に失敗しました', err);
        return Response.json(
            { ok: false, error: 'ファイルの保存に失敗しました' },
            { status: 500 }
        );
    }

    console.log(
        '[upload] files:',
        files.map((f) => `${f.name} (${f.size} bytes)`)
    );

    if (files.length === 0) {
        return Response.json(
            { ok: false, error: 'filesが見つかりませんでした' },
            { status: 400 }
        );
    }

    const filesMeta: Array<{ name: string, size: number, type: string }> = files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type
    }));

    return Response.json({
        ok: true,
        files: filesMeta,
        count: filesMeta.length,
    });
}