// Jednorazowa migracja starych wpisów bloga (OctoberCMS static-pages) do nowego
// statycznego bloga. Parsuje pliki blog-*.htm (viewBag: title/url/kv_description/kv_img)
// i renderuje artykuły PL w wyglądzie starej strony. Czysty start (reset posts.json + blog/).
import fs from "fs";
import path from "path";
import { articleHtml, buildIndexes } from "./templates.mjs";

const SRC = process.env.SRC || "/tmp/blog-src";
const SITE = "https://przewoz-osob-krakow.pl";

function pick(head, key) {
  const m = head.match(new RegExp("^" + key + ' = "([\\s\\S]*?)"\\s*$', "m"));
  return m ? m[1] : "";
}

function parseFile(raw) {
  const head = raw.split(/\n==\s*\r?\n?/)[0];
  const title = pick(head, "title");
  const url = pick(head, "url");
  const kvImg = pick(head, "kv_img");
  let desc = "";
  const m = head.match(/kv_description = "([\s\S]*?)"\r?\n(?:[a-z_0-9]+ = |\[)/);
  if (m) desc = m[1];
  else { const m2 = head.match(/kv_description = "([\s\S]*)"\s*$/m); if (m2) desc = m2[1]; }
  desc = desc.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return { title, url, kvImg, desc };
}

// Czysty start
fs.rmSync("blog", { recursive: true, force: true });

const files = fs.readdirSync(SRC).filter(f => f.endsWith(".htm")).sort();
const posts = [];
let ok = 0;
for (const f of files) {
  const raw = fs.readFileSync(path.join(SRC, f), "utf8");
  const { title, url, kvImg, desc } = parseFile(raw);
  if (!title || !desc) { console.log("SKIP (brak title/desc):", f); continue; }
  const base = (url.split("/").filter(Boolean).pop() || f.replace(/^blog-|\.htm$/g, ""));
  const slug = base + ".html";
  const heroImg = kvImg ? `${SITE}/storage/app/media${kvImg}` : "";
  // Fikcyjne daty: najnowszy = dziś, każdy kolejny 7 dni wstecz
  const d = new Date(); d.setDate(d.getDate() - ok * 7);
  const date = d.toISOString().slice(0, 10);
  const html = articleHtml({ title, bodyHtml: desc, lang: "pl", slug, ctaHref: SITE, ctaLabel: "Zamów przewóz", heroImg, date });
  fs.mkdirSync("blog/pl", { recursive: true });
  fs.writeFileSync(path.join("blog/pl", slug), html);
  posts.push({ title, topicKey: "migracja", lang: "pl", url: `blog/pl/${slug}`, date });
  ok++;
}
fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
buildIndexes();
console.log(`Zmigrowano ${ok}/${files.length} artykulow PL.`);
