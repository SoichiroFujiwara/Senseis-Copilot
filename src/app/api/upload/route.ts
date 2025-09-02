export async function POST(req: Request): Promise<Response> {
    const form: FormData = await req.formData();
    const single: FormDataEntryValue | null = form.get("file");
    const primary: File | null = single instanceof File ? single : null;

    const all: File[] = form.getAll("files").filter((v): v is File => v instanceof File);

    console.log(
        '[upload] primary:',
        primary ? `${primary.name} (${primary.size} bytes)` : '(none)'
    );
    console.log(
        '[upload] files:',
        all.map((f) => `${f.name} (${f.size} bytes)`)
    );

    if (!primary && all.length === 0) {
        return Response.json(
            {ok: false, error: 'fileもfilesも見つかりませんでした'},
            {status: 400}
        );
    }
    const primaryMeta = primary 
        ? {name: primary.name, size: primary.size, type: primary.type}
        : null;
    
    const filesMeta = (primary ? [primary, ...all] : all).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type
    }));

    return Response.json({
        ok: true,
        ...(primaryMeta ?? {}),
        files: filesMeta,
        count: filesMeta.length,
    });


}