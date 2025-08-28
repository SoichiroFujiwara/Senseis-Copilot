import React, { useMemo, useState } from "react";

/**
 * Sensei's Copilot — Test Generator (MVP)
 * -------------------------------------------------
 * What this is:
 *  - A single-file React UI you can drop into a Vite/Next.js app.
 *  - Lets a teacher paste source text, pick subject/unit/grade, and 1‑click generate a test.
 *  - Exports Markdown for easy copy‑paste to Word/Google Docs.
 *  - Includes a clear placeholder for Gemini API integration (see callGemini()).
 *
 * How to use quickly (no backend):
 *  - Render <TestGenerator /> in any page.
 *  - Generation is mocked locally (deterministic template) until you wire Gemini.
 *
 * Gemini integration (pseudo):
 *  - Replace mockGenerate() with await callGemini(prompt) to get JSON per the schema below.
 *  - Keep all student data out of prompts. Use textbook text, not PII.
 */

// -----------------------------
// Types
// -----------------------------
export type Question = {
  id: string;
  type: "mcq" | "short" | "cloze";
  text: string;            // Problem statement (can include {{blank}} for cloze)
  choices?: string[];      // For MCQ
  answer: string;          // Canonical answer (string)
  explanation?: string;    // Short rationale
  points?: number;         // Default 1
};

export type TestSpec = {
  subject: "算数" | "国語" | "理科" | "社会" | "英語";
  grade: string;              // e.g., "小5"
  unit: string;               // e.g., "分数の計算 / 文法:品詞"
  difficulty: "やさしめ" | "標準" | "やや難";
  numQuestions: number;       // 5–50
  format: "MCQ" | "Short" | "Mixed" | "Cloze";
  includeAnswers: boolean;    // 出力に解答つけるか
  includeExplanations: boolean; // 出力に解説つけるか
};

// -----------------------------
// Utilities
// -----------------------------
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function uuid() {
  return Math.random().toString(36).slice(2, 10);
}

function buildPrompt(spec: TestSpec, sourceText: string) {
  // Minimal, audit-friendly prompt. Keep PII out of it.
  return `あなたは小学校の先生のテスト作成を支援するアシスタントです。\n` +
    `出力は必ずJSONだけで、以下のスキーマに厳密に従ってください。\n` +
    `Schema: {\n  \"questions\": [\n    {\n      \"id\": string,\n      \"type\": \"mcq\"|\"short\"|\"cloze\",\n      \"text\": string,\n      \"choices\"?: string[],\n      \"answer\": string,\n      \"explanation\"?: string,\n      \"points\"?: number\n    }\n  ]\n}\n` +
    `方針:\n- 学年: ${spec.grade}, 教科: ${spec.subject}, 単元: ${spec.unit}.\n- 難易度: ${spec.difficulty}.\n- 問題数: ${spec.numQuestions}.\n- 形式: ${spec.format}（MCQ=四択/Short=記述/Cloze=穴埋め）。\n- 日本語で作成。問題文は1問あたり2〜3行以内。\n- 学習指導要領に沿う基礎〜標準的内容を優先。\n- ${spec.includeExplanations ? "各問に70字以内の短い解説を付与。" : "解説は不要。"}\n- ${spec.includeAnswers ? "解答を正確に指定。" : "解答は含めない。"}\n- 下記の教材テキストの内容に厳密に基づくこと。無根拠な知識は使わない。\n\n教材テキスト:\n"""\n${sourceText}\n"""\n`;
}

// -----------------------------
// Gemini integration placeholder
// -----------------------------
async function callGemini(prompt: string): Promise<{ questions: Question[] }> {
  // TODO: Replace this with actual Gemini for Education SDK / REST call.
  // For security: ensure no PII, set safety settings, and keep temperature modest.
  // Return value MUST follow {questions: Question[]}.
  console.warn("[Gemini] Using mock generator. Wire real API here.");
  return mockGenerate();
}

// -----------------------------
// Mock generator (deterministic-ish)
// -----------------------------
function mockGenerate(): Promise<{ questions: Question[] }> {
  const sample: Question[] = [
    {
      id: uuid(),
      type: "mcq",
      text: "分数 1/3 と 1/6 をたすといくつになりますか。",
      choices: ["1/2", "1/3", "1/6", "2/3"],
      answer: "1/2",
      explanation: "通分して 1/3=2/6, 2/6+1/6=3/6=1/2。",
      points: 1,
    },
    {
      id: uuid(),
      type: "short",
      text: "『走る』の活用の種類（国文法）を答えなさい。",
      answer: "五段活用",
      explanation: "ラ行五段活用。連用形は『走り』。",
      points: 1,
    },
    {
      id: uuid(),
      type: "cloze",
      text: "次の文の（ ）に入る語を答えなさい：水は100℃で（　）する。",
      answer: "沸騰",
      explanation: "標準気圧下での性質。",
      points: 1,
    },
    {
      id: uuid(),
      type: "mcq",
      text: "次のうち同じ品詞でないものを選びなさい。",
      choices: ["青い", "高い", "速い", "速く"],
      answer: "速く",
      explanation: "『速く』は副詞、他は形容詞。",
      points: 1,
    },
    {
      id: uuid(),
      type: "short",
      text: "3/4 ÷ 1/8 の計算結果を最も簡単な分数で答えなさい。",
      answer: "6/1（=6）",
      explanation: "÷1/8 は ×8。3/4×8=24/4=6。",
      points: 1,
    },
  ];
  return Promise.resolve({ questions: sample });
}

// -----------------------------
// Rendering helpers
// -----------------------------
function toMarkdown(spec: TestSpec, qs: Question[]): string {
  const header = `# ${spec.subject}テスト（${spec.grade}・${spec.unit}）\n` +
    `難易度: ${spec.difficulty} / 問題数: ${qs.length}\n\n`;

  const body = qs
    .map((q, i) => {
      const n = i + 1;
      const stem = `${n}. ${q.text}`;
      const choiceBlock = q.type === "mcq" && q.choices?.length
        ? "\n" + q.choices.map((c, j) => `   ${String.fromCharCode(65 + j)}. ${c}`).join("\n")
        : "";
      const expl = spec.includeExplanations && q.explanation ? `\n> 解説: ${q.explanation}` : "";
      const ans = spec.includeAnswers ? `\n**解答**: ${q.answer}` : "";
      return [stem, choiceBlock, ans, expl].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return header + body + "\n";
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------
// Main Component
// -----------------------------
export default function TestGenerator() {
  const [spec, setSpec] = useState<TestSpec>({
    subject: "算数",
    grade: "小5",
    unit: "分数の計算",
    difficulty: "標準",
    numQuestions: 10,
    format: "Mixed",
    includeAnswers: true,
    includeExplanations: true,
  });

  const [sourceText, setSourceText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const promptPreview = useMemo(() => buildPrompt(spec, sourceText).slice(0, 1200) + (sourceText.length > 1200 ? "\n…" : ""), [spec, sourceText]);

  async function onGenerate() {
    setError(null);
    setLoading(true);
    setQuestions(null);
    try {
      const cleanText = sourceText.replace(/\s+/g, " ").trim();
      if (!cleanText) throw new Error("教材テキストを入力してください。");

      // Keep question count sane
      const n = clamp(spec.numQuestions, 1, 50);
      const adjustedSpec = { ...spec, numQuestions: n };
      const prompt = buildPrompt(adjustedSpec, cleanText);

      const res = await callGemini(prompt);
      if (!res?.questions?.length) throw new Error("問題が生成されませんでした。");
      setQuestions(res.questions.slice(0, n));
    } catch (e: any) {
      setError(e?.message ?? "不明なエラー");
    } finally {
      setLoading(false);
    }
  }

  function onExport() {
    if (!questions) return;
    const md = toMarkdown(spec, questions);
    downloadText(`${spec.subject}_${spec.unit}_テスト.md`, md);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sensei’s Copilot — テスト自動生成（MVP）</h1>
          <div className="text-sm opacity-70">個人情報を含む文面は入力しないでください</div>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">教材テキスト</h2>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="教科書・プリントの該当範囲をここに貼り付け（児童の氏名等は削除）"
              className="w-full h-56 rounded-xl border p-3 focus:outline-none focus:ring"
            />
            <p className="text-xs text-slate-500">※ PDFはテキスト化して貼り付け推奨。PII（個人情報）は削除してください。</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold">基本設定</h2>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">教科
                <select className="w-full mt-1 border rounded-lg p-2" value={spec.subject}
                        onChange={(e) => setSpec({ ...spec, subject: e.target.value as TestSpec["subject"] })}>
                  {(["算数","国語","理科","社会","英語"] as const).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-sm">学年
                <input className="w-full mt-1 border rounded-lg p-2" value={spec.grade}
                       onChange={(e) => setSpec({ ...spec, grade: e.target.value })} />
              </label>
              <label className="text-sm col-span-2">単元
                <input className="w-full mt-1 border rounded-lg p-2" value={spec.unit}
                       onChange={(e) => setSpec({ ...spec, unit: e.target.value })} />
              </label>
              <label className="text-sm">難易度
                <select className="w-full mt-1 border rounded-lg p-2" value={spec.difficulty}
                        onChange={(e) => setSpec({ ...spec, difficulty: e.target.value as TestSpec["difficulty"] })}>
                  {(["やさしめ","標準","やや難"] as const).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-sm">問題数
                <input type="number" min={1} max={50} className="w-full mt-1 border rounded-lg p-2" value={spec.numQuestions}
                       onChange={(e) => setSpec({ ...spec, numQuestions: Number(e.target.value) })} />
              </label>
              <label className="text-sm">形式
                <select className="w-full mt-1 border rounded-lg p-2" value={spec.format}
                        onChange={(e) => setSpec({ ...spec, format: e.target.value as TestSpec["format"] })}>
                  {(["MCQ","Short","Mixed","Cloze"] as const).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input id="ans" type="checkbox" checked={spec.includeAnswers}
                       onChange={(e) => setSpec({ ...spec, includeAnswers: e.target.checked })} />
                <label htmlFor="ans">解答を含める</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input id="exp" type="checkbox" checked={spec.includeExplanations}
                       onChange={(e) => setSpec({ ...spec, includeExplanations: e.target.checked })} />
                <label htmlFor="exp">解説を含める</label>
              </div>
            </div>
            <button onClick={onGenerate}
                    disabled={loading}
                    className="w-full mt-2 rounded-2xl px-4 py-2 bg-slate-900 text-white hover:opacity-90 disabled:opacity-50">
              {loading ? "生成中…" : "1クリックで問題を生成"}
            </button>
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold">出力プレビュー</h2>
          {!questions && <div className="text-sm text-slate-600">まだ生成していません。教材を貼り、右側の「1クリックで問題を生成」を押してください。</div>}
          {questions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">問題数: {questions.length}</div>
                <div className="flex gap-2">
                  <button onClick={onExport} className="rounded-xl px-3 py-1.5 border">Markdownでエクスポート</button>
                  <button onClick={() => window.print()} className="rounded-xl px-3 py-1.5 border">印刷</button>
                </div>
              </div>
              <ol className="list-decimal pl-5 space-y-3">
                {questions.map((q) => (
                  <li key={q.id} className="space-y-1">
                    <div>{q.text}</div>
                    {q.type === "mcq" && q.choices && (
                      <ul className="pl-6 list-[upper-alpha]">
                        {q.choices.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                    {spec.includeAnswers && (
                      <div className="text-sm text-slate-600"><span className="font-semibold">解答:</span> {q.answer}</div>
                    )}
                    {spec.includeExplanations && q.explanation && (
                      <div className="text-sm text-slate-500">解説: {q.explanation}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold">プロンプト（Gemini 連携用の下書き）</h2>
          <pre className="whitespace-pre-wrap text-xs bg-slate-50 p-3 rounded-xl border max-h-64 overflow-auto">{promptPreview}</pre>
          <p className="text-xs text-slate-500">※ 監査のために、実運用でも生成に使ったプロンプトと教材のハッシュをログに残すことを推奨。</p>
        </section>

        <footer className="text-xs text-slate-500 pb-8">
          <div>設計メモ：
            <ul className="list-disc pl-5">
              <li>PIIを含まない教材テキストのみをモデルに渡す（生徒名などは削除）。</li>
              <li>Gemini呼び出しはサーバー側（Edge/Cloud Functions）で実施し、APIキーはフロントに出さない。</li>
              <li>出力は厳密なJSONスキーマで受け、UI側でレイアウト整形。教師は1クリックでMarkdown/印刷。</li>
              <li>評価基準：網羅性（単元カバー）・誤答誘因の質（MCQの選択肢）・表記ゆれ・日本語の自然さ。</li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}

