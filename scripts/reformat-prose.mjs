#!/usr/bin/env node
// Semantic-line-break reformatter for prose markdown.
// Preserves code fences, tables, headings, YAML frontmatter, HTML comments,
// and horizontal rules. Rejoins hard-wrapped prose and bullet continuations,
// then splits at sentence boundaries so each sentence starts a new line.
//
// Policy rationale lives in AGENTS.md under Operating Stance.

import { readFileSync, writeFileSync } from "node:fs";

const ABBR =
  /^(e\.g\.|i\.e\.|etc\.|vs\.|Mr\.|Mrs\.|Ms\.|Dr\.|Inc\.|Ltd\.|Co\.|Fig\.|No\.|Jr\.|Sr\.|St\.|Ave\.|Rd\.|v\.|cf\.|al\.|approx\.|Prof\.|Gen\.)$/i;
const SENTENCE_TERMS = new Set([".", "?", "!"]);
const NEXT_STARTERS = /[A-Z`[*_"(]/;

const isBlank = (line) => /^\s*$/.test(line);
const isHeading = (line) => /^#{1,6}\s/.test(line);
const isTableLine = (line) => line.trim().startsWith("|");
const matchFence = (line) => line.match(/^(\s*)(```|~~~)/);
const isHR = (line) => /^\s*(---|\*\*\*|___)\s*$/.test(line);
const matchList = (line) => line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
const isCommentStart = (line) => line.trim().startsWith("<!--");

function isBlockBoundary(line) {
  return (
    isBlank(line) ||
    isHeading(line) ||
    isTableLine(line) ||
    matchFence(line) !== null ||
    isHR(line) ||
    matchList(line) !== null ||
    isCommentStart(line)
  );
}

function sentenceSplitAt(text, i, cur) {
  const c = text[i];
  if (!SENTENCE_TERMS.has(c)) return -1;
  if (i + 1 >= text.length || text[i + 1] !== " ") return -1;
  let j = i + 1;
  while (j < text.length && text[j] === " ") j++;
  if (j >= text.length) return -1;
  if (!NEXT_STARTERS.test(text[j])) return -1;
  const lastWord = cur.match(/(\S+)$/)?.[1] || "";
  if (ABBR.test(lastWord)) return -1;
  return j;
}

function splitSentences(text) {
  if (!text) return [];
  const out = [];
  let cur = "";
  let inCode = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    cur += c;
    if (c === "`") inCode = !inCode;
    if (inCode) continue;
    const next = sentenceSplitAt(text, i, cur);
    if (next < 0) continue;
    out.push(cur.trim());
    cur = "";
    i = next - 1;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function collectFrontmatter(lines) {
  if (lines[0] !== "---") return { block: [], next: 0 };
  const block = [lines[0]];
  let i = 1;
  while (i < lines.length && lines[i] !== "---") block.push(lines[i++]);
  if (i < lines.length) block.push(lines[i++]);
  return { block, next: i };
}

function collectFence(lines, start) {
  const fence = matchFence(lines[start])[2];
  const block = [lines[start]];
  let i = start + 1;
  while (i < lines.length) {
    block.push(lines[i]);
    const closed = lines[i].trim().startsWith(fence);
    i++;
    if (closed) break;
  }
  return { block, next: i };
}

function collectWhile(lines, start, pred) {
  const block = [];
  let i = start;
  while (i < lines.length && pred(lines[i])) {
    block.push(lines[i]);
    i++;
  }
  return { block, next: i };
}

function collectComment(lines, start) {
  const block = [];
  let i = start;
  while (i < lines.length) {
    block.push(lines[i]);
    const closed = lines[i].includes("-->");
    i++;
    if (closed) break;
  }
  return { block, next: i };
}

function collectListItem(lines, start) {
  const [, indent, marker, firstContent] = matchList(lines[start]);
  const content = [firstContent];
  let i = start + 1;
  while (i < lines.length) {
    const next = lines[i];
    if (isBlockBoundary(next)) break;
    const leadWs = next.match(/^(\s*)/)[1].length;
    if (leadWs < indent.length + 1) break;
    content.push(next.trim());
    i++;
  }
  return {
    indent,
    marker,
    content: content.join(" ").replace(/\s+/g, " ").trim(),
    next: i,
  };
}

function collectParagraph(lines, start) {
  const para = [lines[start]];
  let i = start + 1;
  while (i < lines.length && !isBlockBoundary(lines[i])) {
    para.push(lines[i]);
    i++;
  }
  return {
    text: para.join(" ").replace(/\s+/g, " ").trim(),
    next: i,
  };
}

function emitListItem(indent, marker, content) {
  const contIndent = indent + " ".repeat(marker.length + 1);
  const sentences = splitSentences(content);
  if (sentences.length === 0) return [`${indent}${marker} `];
  const out = [`${indent}${marker} ${sentences[0]}`];
  for (let s = 1; s < sentences.length; s++) {
    out.push(`${contIndent}${sentences[s]}`);
  }
  return out;
}

function processLine(lines, i, out) {
  const line = lines[i];
  if (isBlank(line) || isHeading(line) || isHR(line)) {
    out.push(line);
    return i + 1;
  }
  if (matchFence(line)) {
    const r = collectFence(lines, i);
    out.push(...r.block);
    return r.next;
  }
  if (isTableLine(line)) {
    const r = collectWhile(lines, i, isTableLine);
    out.push(...r.block);
    return r.next;
  }
  if (isCommentStart(line)) {
    const r = collectComment(lines, i);
    out.push(...r.block);
    return r.next;
  }
  if (matchList(line)) {
    const r = collectListItem(lines, i);
    out.push(...emitListItem(r.indent, r.marker, r.content));
    return r.next;
  }
  const r = collectParagraph(lines, i);
  out.push(...splitSentences(r.text));
  return r.next;
}

function reformat(content) {
  const lines = content.split("\n");
  const out = [];
  const { block: fm, next: afterFm } = collectFrontmatter(lines);
  out.push(...fm);
  let i = afterFm;
  while (i < lines.length) {
    i = processLine(lines, i, out);
  }
  return out.join("\n");
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: reformat-prose.mjs <file> [<file> ...]");
  process.exit(1);
}
for (const f of files) {
  const orig = readFileSync(f, "utf8");
  const next = reformat(orig);
  if (orig !== next) {
    writeFileSync(f, next);
    console.log(`reformatted: ${f}`);
  } else {
    console.log(`unchanged:   ${f}`);
  }
}
