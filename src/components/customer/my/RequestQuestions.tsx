"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { answerRequestQuestion } from "@/lib/db/actions";
import { useDb } from "@/lib/db/store";
import type { PartRequest } from "@/lib/types";
import { toast } from "../../shared/Misc";
import { useT } from "../../providers/LangProvider";
import { Button, Card, Chip, SectionTitle, Textarea } from "../../ui/primitives";

/** Seller questions before quoting; answers are visible to every matched shop (file 00 §7.2). */
export function RequestQuestions({ r }: { r: PartRequest }) {
  const { tx, ago } = useT();
  const vendors = useDb((s) => s.vendors);
  if (!r.questions.length) return null;
  const open = r.questions.filter((q) => !q.answer).length;
  return (
    <section>
      <SectionTitle>
        ❓ {tx("দোকানের প্রশ্ন", "Questions from shops")} {open > 0 && <span className="ml-1 rounded-full bg-bad px-2 text-sm text-white">{open}</span>}
      </SectionTitle>
      <div className="space-y-3">
        {r.questions.map((q) => {
          const v = vendors.find((x) => x.id === q.vendor_id);
          return (
            <Card key={q.id} className="space-y-2 p-4">
              <p className="text-sm text-muted">
                {v?.shop_name_bn ?? tx("একটা দোকান", "A shop")} · {ago(q.asked_at)}
              </p>
              <p className="font-semibold">“{q.question}”</p>
              {q.answer ? (
                <p className="rounded-xl bg-ok-soft px-3 py-2 text-ok">
                  ✅ {tx("আপনার উত্তর:", "Your answer:")} {q.answer}
                </p>
              ) : (
                <AnswerBox requestId={r.id} questionId={q.id} />
              )}
            </Card>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{tx("উত্তর সব দোকান দেখবে। ফোন নম্বর বা ঠিকানা লিখবেন না।", "All shops see your answer. Don't write your phone number or address.")}</p>
    </section>
  );
}

function AnswerBox({ requestId, questionId }: { requestId: string; questionId: string }) {
  const { tx } = useT();
  const [text, setText] = useState("");
  const quick = [tx("জানি না", "I don't know"), tx("হ্যাঁ", "Yes"), tx("না", "No"), tx("পুরনো পার্টের ছবি দিচ্ছি", "I'll send a photo of the old part")];
  const send = (value: string) => {
    if (!value.trim()) return;
    answerRequestQuestion(requestId, questionId, value.trim());
    toast(tx("উত্তর পাঠানো হয়েছে", "Answer sent"));
  };
  return (
    <div className="space-y-2">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {quick.map((t) => (
          <Chip key={t} onClick={() => send(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tx("উত্তর লিখুন…", "Type your answer…")} className="min-h-20" />
      <Button variant="brand" full onClick={() => send(text)} disabled={!text.trim()}>
        <Send className="size-4" aria-hidden /> {tx("উত্তর পাঠান", "Send answer")}
      </Button>
    </div>
  );
}
