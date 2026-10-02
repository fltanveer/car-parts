"use client";

import { Download, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/providers/LangProvider";
import { Button, Textarea } from "@/components/ui/primitives";
import { type CsvCell, csvObjects, downloadCsv } from "./csv";

/**
 * Pick a CSV file (or paste text), parse in the browser and hand the rows to
 * the caller for preview. Offers a sample file so the format is obvious.
 */
export function CsvImport({ onRows, sample, sampleName, label }: { onRows: (rows: Record<string, string>[]) => void; sample: CsvCell[][]; sampleName: string; label?: string }) {
  const { tx, d } = useT();
  const file = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [count, setCount] = useState<number | null>(null);

  const run = (t: string) => {
    const rows = csvObjects(t);
    setCount(rows.length);
    onRows(rows);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="brand" size="md" onClick={() => file.current?.click()}>
          <FileUp className="size-4" /> {label ?? tx("CSV ফাইল বাছুন", "Choose CSV file")}
        </Button>
        <Button variant="outline" size="md" onClick={() => downloadCsv(sampleName, sample)}>
          <Download className="size-4" /> {tx("নমুনা ফাইল", "Sample file")}
        </Button>
        <input
          ref={file}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            void f.text().then((t) => {
              setText(t);
              run(t);
            });
            e.target.value = "";
          }}
        />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-muted">{tx("অথবা CSV লেখা পেস্ট করুন", "Or paste CSV text")}</summary>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-2 font-mono text-xs" placeholder={sample.map((r) => r.join(",")).join("\n")} />
        <Button size="sm" variant="outline" className="mt-2" onClick={() => run(text)} disabled={!text.trim()}>
          {tx("পড়ুন", "Parse")}
        </Button>
      </details>
      {count !== null && <p className="text-sm text-muted">{tx(`${d(count)}টা সারি পড়া হয়েছে`, `${count} rows parsed`)}</p>}
    </div>
  );
}
