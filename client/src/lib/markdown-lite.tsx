import React from "react";

/**
 * Markdown-lite preview renderer shared by the PR composer and the PR detail
 * page — headings, lists, code fences, bold, inline code. Built from parsed
 * strings into React nodes — never raw HTML.
 */
export function renderMarkdownLite(md: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let k = 0;

  const inline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) {
        parts.push(
          <strong key={`${keyBase}-i${k++}`} className="font-semibold text-slate-100">
            {tok.slice(2, -2)}
          </strong>,
        );
      } else {
        parts.push(
          <code key={`${keyBase}-i${k++}`} className="mx-0.5 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-cyan-300">
            {tok.slice(1, -1)}
          </code>,
        );
      }
      last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      out.push(
        <pre
          key={`${keyBase}-c${k++}`}
          className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0d1117] p-3 font-mono text-[12px] leading-relaxed text-slate-300"
        >
          {code.join("\n")}
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(
        <p
          key={`${keyBase}-h${k++}`}
          className={`mt-3 mb-1 mr-2 font-bold text-white ${level <= 2 ? "text-sm" : "text-[13px]"}`}
        >
          {heading[2]}
        </p>,
      );
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      out.push(
        <ul key={`${keyBase}-u${k++}`} className="mt-2 mb-2 ml-1 space-y-1.5">
          {items.map((item, idx) => (
            <li key={`${keyBase}-l${k++}-${idx}`} className="flex items-start gap-2 text-[13px] text-slate-300">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400/70" />
              <span className="min-w-0 flex-1">{inline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^([-*]\s|#{1,4}\s|```)/.test(lines[i])) {
      para.push(lines[i++]);
    }
    out.push(
      <p key={`${keyBase}-p${k++}`} className="mt-2 mb-2 text-[13px] leading-relaxed text-slate-300">
        {inline(para.join(" "))}
      </p>,
    );
  }
  return out;
}
