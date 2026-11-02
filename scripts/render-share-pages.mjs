// Generated share URLs need real HTML metadata: fragment-only links share one preview.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function renderSharePages(html, pages, check = false) {
  const dates = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", month: "2-digit", day: "2-digit", year: "2-digit",
  });
  const cards = pages.map((page) => ({
    ...page,
    ...(page.counters && { counters: page.counters.map((counter) => ({
      ...counter, since: dates.format(Date.parse(counter.resetAt)),
    })) }),
  }));
  const images = JSON.parse(execFileSync("python3", [fileURLToPath(new URL("render-share-cards.py", import.meta.url))], {
    input: JSON.stringify(cards), encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
  }));
  const outputs = new Map();
  cards.forEach((page, index) => {
    if (!/^[a-z0-9-]+$/.test(page.id)) throw new Error(`Invalid share page ID: ${page.id}`);
    const path = `share/home/${page.id}/`;
    const url = `https://lisaluo.com/${path}`;
    const image = Buffer.from(images[index], "base64");
    const digest = createHash("sha256").update(image).digest("hex").slice(0, 12);
    const imagePath = `${path}card-${digest}.png`;
    const description = page.counters
      ? page.counters.map((counter) => `${counter.label}: since ${counter.since}`).join(". ")
      : (Array.isArray(page.writing) ? page.writing.join("\n") : String(page.writing || ""));
    const title = page.title || page.label || description;
    const metadata = {
      description,
      "og:title": title,
      "og:description": description,
      "og:url": url,
      "og:image": `https://lisaluo.com/${imagePath}`,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": description,
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": `https://lisaluo.com/${imagePath}`,
      "twitter:image:alt": description,
    };
    let rendered = html
      .replace(/(<meta http-equiv="Content-Security-Policy"[^>]+>)/,
        '$1\n    <base href="../../../">\n    <meta name="robots" content="noindex, follow">')
      .replace('<link rel="canonical" href="https://lisaluo.com/">', `<link rel="canonical" href="${url}">`)
      .replace(/<title>[^<]*<\/title>/, () => `<title>${escape(title)} | lisa luo</title>`)
      .replace("<body>", `<body data-share-page="home/${page.id}">`)
      .replace(/(<meta (?:name|property)="([^"]+)" content=")[^"]*(">)/g,
        (tag, start, key, end) => key in metadata ? start + escape(metadata[key]) + end : tag);
    // The selected card also comes first for visitors without JavaScript.
    const articles = [...rendered.matchAll(/          <article class="feed-page"[^\n]*<\/article>/g)].map((match) => match[0]);
    if (articles.length !== pages.length) throw new Error("Static feed markup is missing");
    const rotated = [...articles.slice(index), ...articles.slice(0, index)];
    rendered = rendered.replace(/          <!-- feed:start -->[\s\S]*?          <!-- feed:end -->/,
      () => ["          <!-- feed:start -->", ...rotated, "          <!-- feed:end -->"].join("\n"));
    outputs.set(`${path}index.html`, Buffer.from(rendered));
    outputs.set(imagePath, image);
  });
  const manifestPath = new URL("share/generated-files.json", root);
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : [];
  const stale = previous.filter((path) => !outputs.has(path));
  outputs.set("share/generated-files.json", Buffer.from(JSON.stringify([...outputs.keys()], null, 2) + "\n"));
  let mismatch = false;
  for (const [path, data] of outputs) {
    const destination = new URL(path, root);
    if (check) {
      if (!existsSync(destination) || !readFileSync(destination).equals(data)) mismatch = true;
    } else {
      mkdirSync(new URL(".", destination), { recursive: true });
      writeFileSync(destination, data);
    }
  }
  for (const path of stale) {
    // Only remove files previously recorded in this generator's output namespace.
    if (!/^share\/home\/[a-z0-9-]+\/(index\.html|card-[a-f0-9]{12}\.png)$/.test(path)) {
      throw new Error(`Unexpected generated file path: ${path}`);
    }
    if (check) mismatch = true;
    else rmSync(new URL(path, root), { force: true });
  }
  if (mismatch) throw new Error("Share pages are stale. Run node scripts/prerender.mjs");
  console.log(`${check ? "Checked" : "Rendered"} ${cards.length} page-specific share URLs and OG images`);
}
