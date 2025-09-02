export async function POST(req: Request): Promise<Response> {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
        return Response.json({ok: false, error: "ファイルが見つかりません"}, {status: 400});
    }
    console.log("受信ファイル: ", file.name, file.size, "bytes", file.type);
    return Response.json({
        ok: true,
        name: file.name,
        size: file.size,
        type: file.type,
    });
}