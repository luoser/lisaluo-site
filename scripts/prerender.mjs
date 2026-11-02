// Optional authoring step. GitHub Pages serves the committed HTML directly.
// Run after editing content.js: node scripts/prerender.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const htmlPath = new URL("index.html", root);
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL("content.js", root), "utf8"), context);
const pages = context.window.LISALUO_HOME_PAGES;
if (!Array.isArray(pages) || !pages.length) throw new Error("Home feed is empty");

const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "2-digit",
});

function writingMarkup(page) {
  const text = Array.isArray(page.writing) ? page.writing.join("\n") : String(page.writing || "");
  if (!page.link || !text.includes(page.link.text)) return escape(text);
  const index = text.indexOf(page.link.text);
  return escape(text.slice(0, index))
    + `<a href="${escape(page.link.href)}">${escape(page.link.text)}</a>`
    + escape(text.slice(index + page.link.text.length));
}

function pageMarkup(page, index) {
  const label = escape(page.title || page.label || "Introduction");
  let body;
  if (page.type === "sobriety") {
    // Reset dates remain accurate without JS; live day totals are an enhancement.
    body = `<div class="sobriety-grid" aria-live="off">${page.counters.map((counter) => (
      `<section class="sobriety-cell" aria-label="${escape(counter.label)}">`
      + `<h2 class="sobriety-label">${escape(counter.label)}</h2>`
      + `<p class="sobriety-since">since <time datetime="${escape(counter.resetAt)}">${dateFormat.format(Date.parse(counter.resetAt))}</time></p>`
      + "</section>"
    )).join("")}</div>`;
  } else {
    body = (page.ascii ? `<pre class="page-ascii" aria-hidden="true">${escape(page.ascii)}</pre>` : "")
      + '<div class="page-copy">'
      + (page.title ? `<h2 class="page-title">${escape(page.title)}</h2>` : "")
      + `<pre class="page-writing">${writingMarkup(page)}</pre></div>`;
  }
  return `          <article class="feed-page" data-logical-index="${index}" data-intro="true" data-kind="${escape(page.type || "writing")}" aria-label="${label}">${body}</article>`;
}

const original = readFileSync(htmlPath, "utf8");
const region = /          <!-- feed:start -->[\s\S]*?          <!-- feed:end -->/;
if (!region.test(original)) throw new Error("Missing static feed markers");
const rendered = original.replace(region, () => [
  "          <!-- feed:start -->",
  ...pages.map(pageMarkup),
  "          <!-- feed:end -->",
].join("\n"));

if (process.argv.includes("--check")) {
  if (original !== rendered) {
    console.error("Static feed is stale. Run node scripts/prerender.mjs");
    process.exitCode = 1;
  } else {
    console.log("Static feed matches content.js");
  }
} else {
  writeFileSync(htmlPath, rendered);
  console.log(`Rendered ${pages.length} home cards into ${fileURLToPath(htmlPath)}`);
}
