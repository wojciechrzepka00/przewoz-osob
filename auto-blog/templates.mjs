// Wspólne szablony bloga w wyglądzie starej strony (nagłówek/stopka/CSS z motywu).
// Używane przez generator (nowe artykuły) i migrację (stare wpisy) oraz builder indeksów.
import { HEAD_ASSETS, HEADER, FOOTER } from "./layout.mjs";

const SITE = "https://przewoz-osob-krakow.pl";
const BLOG = "https://blog.przewoz-osob-krakow.pl";
const DEFAULT_HERO = "/assets/hero-blog.jpg";

const heroImgs = (src) => `<img class="bg_desktop" src="${src}" alt=""><img class="bg_mobile" src="${src}" alt="">`;

export const LANGS = [
  { code: "pl", label: "Polski" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "uk", label: "Українська" },
];

export const UI = {
  pl: { blogTitle: "Blog", blogLead: "Poradniki o wynajmie busów, transferach lotniskowych, weselach, konferencjach i wycieczkach w Krakowie i Małopolsce.", all: "Wszystkie artykuły", cta: "Zamów przewóz", read: "Czytaj więcej", empty: "Brak artykułów." },
  en: { blogTitle: "Blog", blogLead: "Guides on bus rental, airport transfers, weddings, conferences and trips in Kraków and Małopolska.", all: "All articles", cta: "Book a transfer", read: "Read more", empty: "No articles yet." },
  es: { blogTitle: "Blog", blogLead: "Guías sobre alquiler de autobuses, traslados al aeropuerto, bodas, conferencias y excursiones en Cracovia y Małopolska.", all: "Todos los artículos", cta: "Reservar traslado", read: "Leer más", empty: "No hay artículos." },
  uk: { blogTitle: "Блог", blogLead: "Поради щодо оренди мікроавтобусів, трансферів з аеропорту, весіль, конференцій та екскурсій у Кракові та Малопольщі.", all: "Усі статті", cta: "Замовити трансфер", read: "Читати далі", empty: "Ще немає статей." },
};

// Przełącznik języka bloga (PL/EN/ES/UK -> /{lang}/)
function langSwitcher(active) {
  return `<div class="blog-langbar"><div class="container"><div class="blog-langbar-in">` +
    LANGS.map(l => `<a href="/${l.code}/" class="${l.code === active ? 'is-active' : ''}">${l.label}</a>`).join("") +
    `</div></div></div>`;
}

// Drobny CSS spinający blog z motywem (listing + langbar) — reszta wyglądu z CSS motywu
const BLOG_CSS = `<style>
.blog-langbar{ background:#175489; }
.blog-langbar-in{ display:flex; gap:6px; flex-wrap:wrap; padding:8px 0; }
.blog-langbar a{ color:#cfe0f3; text-decoration:none; font:700 13px/1 'Lato',sans-serif; padding:6px 12px; border-radius:20px; }
.blog-langbar a.is-active{ background:#2a89dc; color:#fff; }
.blog-list{ padding:40px 0 60px; }
.blog-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:22px; }
.blog-card{ display:block; border:1px solid #e1e6ee; border-radius:10px; overflow:hidden; text-decoration:none; color:#222; background:#fff; transition:box-shadow .15s, transform .15s; }
.blog-card:hover{ box-shadow:0 8px 26px rgba(23,84,137,.13); transform:translateY(-2px); }
.blog-card-body{ padding:20px; }
.blog-card h2{ font:700 18px/1.35 'Lato',sans-serif; color:#175489; margin:0 0 8px; }
.blog-card .date{ font:400 12px/1 'Roboto',sans-serif; color:#716d6e; }
.blog-cta{ display:inline-block; margin-top:26px; background:#2a89dc; color:#fff; text-decoration:none; font:700 15px/1 'Lato',sans-serif; padding:14px 30px; border-radius:6px; }
.blog-back{ display:inline-block; margin:24px 0 0; color:#2a89dc; font:700 13px/1 'Lato',sans-serif; text-decoration:none; }
.kv_blog .title h1{ position:relative; z-index:2; }
</style>`;

function head(title, desc, canonical, lang) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
${HEAD_ASSETS}
${BLOG_CSS}
</head>
<body>
${HEADER}
${langSwitcher(lang)}`;
}

// Pojedynczy artykuł — hero + treść w wrapperze motywu (prices/container/row)
export function articleHtml({ title, bodyHtml, lang, slug, ctaHref, ctaLabel, heroImg }) {
  const t = UI[lang] || UI.pl;
  const canonical = `${BLOG}/blog/${lang}/${slug}`;
  const desc = String(title).slice(0, 155);
  const hero = heroImgs(heroImg || DEFAULT_HERO);
  return head(`${title} | Przewóz osób Kraków`, desc, canonical, lang) + `
<section class="kv kv_blog">
  ${hero}
  <div class="title"><h1>${title}</h1></div>
</section>
<section class="prices">
  <div class="container">
    <div class="row">
      ${bodyHtml}
      <p><a class="blog-cta" href="${ctaHref || SITE}">${ctaLabel || t.cta} →</a></p>
      <a class="blog-back" href="/${lang}/">← ${t.all}</a>
    </div>
  </div>
</section>
${FOOTER}
</body>
</html>`;
}

// Index per język — listing tylko artykułów tego języka
export function indexHtml({ lang, posts }) {
  const t = UI[lang] || UI.pl;
  const canonical = `${BLOG}/${lang}/`;
  const cards = posts.length
    ? `<div class="blog-grid">` + posts.map(p => `
        <a class="blog-card" href="/${p.url}">
          <div class="blog-card-body">
            <h2>${p.title}</h2>
            <span class="date">${p.date || ""}</span>
          </div>
        </a>`).join("") + `</div>`
    : `<p>${t.empty}</p>`;
  return head(`${t.blogTitle} — Przewóz osób Kraków`, t.blogLead, canonical, lang) + `
<section class="kv kv_blog">
  ${heroImgs(DEFAULT_HERO)}
  <div class="title"><h1>${t.blogTitle}</h1></div>
</section>
<section class="prices blog-list">
  <div class="container">
    <p class="subtitle" style="margin-bottom:26px">${t.blogLead}</p>
    ${cards}
  </div>
</section>
${FOOTER}
</body>
</html>`;
}

import fs from "fs";
import path from "path";

// Przebuduj indeksy per-język z posts.json + root redirect na /pl/
export function buildIndexes() {
  let posts = [];
  try { posts = JSON.parse(fs.readFileSync("posts.json", "utf8")); } catch (e) {}
  for (const l of LANGS) {
    const langPosts = posts.filter(p => p.lang === l.code);
    fs.mkdirSync(l.code, { recursive: true });
    fs.writeFileSync(path.join(l.code, "index.html"), indexHtml({ lang: l.code, posts: langPosts }));
  }
  // root -> /pl/
  fs.writeFileSync("index.html", `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8">` +
    `<meta http-equiv="refresh" content="0; url=/pl/"><link rel="canonical" href="https://blog.przewoz-osob-krakow.pl/pl/">` +
    `<title>Blog — Przewóz osób Kraków</title></head><body><a href="/pl/">Blog</a></body></html>`);
  console.log(`Indeksy przebudowane (${LANGS.map(l => l.code + ':' + posts.filter(p => p.lang === l.code).length).join(', ')})`);
}
