export async function POST(req: Request): Promise<Response> {
    const form: FormData = await req.formData();
    const files: File[] = form.getAll("files").filter((v): v is File => v instanceof File);


    console.log(
        '[upload] files:',
        files.map((f) => `${f.name} (${f.size} bytes)`)
    );

    if (files.length === 0) {
        return Response.json(
            {ok: false, error: 'filesが見つかりませんでした'},
            {status: 400}
        );
    }
    
    const filesMeta: Array<{name: string, size: number, type: string}> = files.map((f) => ({
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