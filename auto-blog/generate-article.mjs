// generate-article.mjs
// Generuje JEDEN temat od razu we WSZYSTKICH skonfigurowanych językach przy każdym
// uruchomieniu — jako osobne, indeksowalne podstrony w blog/{lang}/, i dopisuje wpisy
// do posts.json. Wymaga zmiennej środowiskowej ANTHROPIC_API_KEY (sekret w GitHub Actions).
//
// Blog statyczny dla "Przewóz osób Kraków" (Legendary Kraków) — hostowany na osobnej
// subdomenie, z linkami wstecznymi do głównej witryny (SEO).

import fs from "fs";
import path from "path";

const SITE = "https://przewoz-osob-krakow.pl";

const LANGS = [
  { code: "pl", name: "polski",     dir: "ltr" },
  { code: "en", name: "angielski",  dir: "ltr" },
  { code: "es", name: "hiszpański", dir: "ltr" },
  { code: "uk", name: "ukraiński",  dir: "ltr" },
];

// Etykiety UI per język (nagłówek/stopka artykułu)
const UI = {
  pl: { all: "Wszystkie artykuły", back: "Przewóz osób Kraków", cta: "Zamów przewóz", menu: ["O nas","Busy","Oferta","Cennik","Kontakt"] },
  en: { all: "All articles",       back: "Przewóz osób Kraków", cta: "Book a transfer", menu: ["About","Fleet","Offer","Pricing","Contact"] },
  es: { all: "Todos los artículos",back: "Przewóz osób Kraków", cta: "Reservar traslado", menu: ["Sobre nosotros","Flota","Oferta","Precios","Contacto"] },
  uk: { all: "Усі статті",          back: "Przewóz osób Kraków", cta: "Замовити трансфер", menu: ["Про нас","Автопарк","Послуги","Ціни","Контакт"] },
};

// Tematy bazowe (po polsku — model pisze od razu w docelowym języku)
const TOPICS = [
  "Wynajem busa na wesele w Krakowie i okolicach",
  "Transfer z lotniska Katowice-Pyrzowice do Krakowa",
  "Transfer z lotniska Kraków-Balice do centrum i hoteli",
  "Przewóz gości konferencyjnych i delegacji firmowych",
  "Wycieczki szkolne busem — na co zwrócić uwagę przy organizacji",
  "Przewozy pracownicze do zakładów pod Krakowem",
  "Wyjazd na narty do Zakopanego busem z Krakowa",
  "Transport gości na wesele — logistyka odbioru i powrotu",
  "Przewóz osób z dużym bagażem i sprzętem sportowym",
  "Podróż grupowa po Małopolsce — Wieliczka, Oświęcim, Zakopane",
  "Dlaczego warto zarezerwować bus z kierowcą z wyprzedzeniem",
  "Komfortowy przejazd dla seniorów i osób o ograniczonej mobilności",
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadPosts() {
  try { return JSON.parse(fs.readFileSync("posts.json", "utf-8")); } catch (e) { return []; }
}

function pickTopic(posts) {
  const used = new Set(posts.map(p => p.topicKey));
  const unused = TOPICS.filter(t => !used.has(t));
  const pool = unused.length ? unused : TOPICS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generateArticle(topic, lang) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1400,
      messages: [
        {
          role: "user",
          content: `Napisz artykuł na blog firmy "Przewóz osób Kraków" (Legendary Kraków) — profesjonalny wynajem busów z kierowcą w Krakowie i Małopolsce: wesela, konferencje, wycieczki, przewozy pracownicze, transfery lotniskowe (Katowice-Pyrzowice, Kraków-Balice). Flota busów 8-20-50 osób. Temat (opisany po polsku, ale NAPISZ CAŁY ARTYKUŁ w języku: ${lang.name}): "${topic}". Artykuł: praktyczny, konkretny, 400-600 słów, w języku ${lang.name}, HTML (akapity <p>, ewentualnie <h3>). Nie wymyślaj konkretnych cen. Nie dodawaj tytułu H1. Zwróć TYLKO: pierwsza linia = przetłumaczony tytuł artykułu (czysty tekst, bez HTML), druga linia dokładnie "---", a dalej treść HTML w języku ${lang.name}.`,
        },
      ],
    }),
  });
  const data = await res.json();
  const text = (data.content?.map(b => b.text || "").join("\n") || "").trim();
  const sepIndex = text.indexOf("---");
  if (sepIndex === -1) return { translatedTitle: topic, body: text };
  const translatedTitle = text.slice(0, sepIndex).replace(/\n/g, " ").trim();
  const body = text.slice(sepIndex + 3).trim();
  return { translatedTitle, body };
}

const TEMPLATE = (title, body, lang) => {
  const t = UI[lang.code] || UI.pl;
  return `<!DOCTYPE html>
<html lang="${lang.code}"${lang.dir === "rtl" ? ' dir="rtl"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Przewóz osób Kraków</title>
<meta name="description" content="${title} — blog Przewóz osób Kraków (Legendary Kraków).">
<link rel="canonical" href="https://blog.przewoz-osob-krakow.pl/blog/${lang.code}/__SLUG__">
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
<style>
  :root{ --blue:#2a89dc; --dark:#175489; --ink:#222; --muted:#716d6e; }
  *{ box-sizing:border-box; }
  body{ font-family:'Roboto',sans-serif; color:var(--ink); background:#fff; margin:0; line-height:1.75; }
  a{ color:var(--blue); }
  .topbar{ background:var(--dark); color:#fff; }
  .topbar-in{ max-width:900px; margin:0 auto; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .brand{ font-family:'Lato',sans-serif; font-weight:900; font-size:18px; color:#fff; text-decoration:none; letter-spacing:.3px; }
  .brand span{ color:#9fd0ff; }
  .topnav a{ color:#dceafd; text-decoration:none; font-size:14px; margin-left:16px; }
  .topnav a:hover{ color:#fff; }
  .wrap{ max-width:760px; margin:0 auto; padding:44px 24px 70px; }
  .back{ display:inline-block; margin-bottom:22px; font-size:13px; color:var(--blue); text-decoration:none; }
  h1{ font-family:'Lato',sans-serif; font-weight:900; font-size:30px; line-height:1.25; margin:0 0 22px; color:var(--dark); }
  article p{ font-size:17px; color:#333; margin:0 0 18px; }
  article h3{ font-family:'Lato',sans-serif; color:var(--dark); margin:28px 0 10px; }
  .cta{ display:inline-block; margin-top:26px; background:var(--blue); color:#fff; text-decoration:none; font-family:'Lato',sans-serif; font-weight:700; padding:13px 26px; border-radius:6px; }
  footer{ background:#f4f6f9; border-top:1px solid #e3e8ef; }
  .foot-in{ max-width:900px; margin:0 auto; padding:26px 24px; font-size:14px; color:var(--muted); display:flex; flex-wrap:wrap; gap:8px 20px; align-items:center; }
  .foot-in a{ color:var(--dark); text-decoration:none; }
</style>
</head>
<body>
<header class="topbar"><div class="topbar-in">
  <a class="brand" href="${SITE}">Przewóz osób <span>Kraków</span></a>
  <nav class="topnav">
    <a href="${SITE}/pl/oferta">${t.menu[2]}</a>
    <a href="${SITE}/pl/cennik">${t.menu[3]}</a>
    <a href="${SITE}/pl/kontakt">${t.menu[4]}</a>
    <a href="tel:+48728814659">+48 728 814 659</a>
  </nav>
</div></header>
<div class="wrap">
  <a class="back" href="../../index.html">← ${t.all}</a>
  <h1>${title}</h1>
  <article>
  ${body}
  </article>
  <a class="cta" href="${SITE}">${t.cta} →</a>
</div>
<footer><div class="foot-in">
  <a class="brand" href="${SITE}" style="color:var(--dark)">Przewóz osób Kraków — Legendary Kraków</a>
  <a href="${SITE}/pl">${t.menu[0]}</a>
  <a href="${SITE}/pl/busy">${t.menu[1]}</a>
  <a href="${SITE}/pl/oferta">${t.menu[2]}</a>
  <a href="${SITE}/pl/cennik">${t.menu[3]}</a>
  <a href="${SITE}/pl/kontakt">${t.menu[4]}</a>
</div></footer>
</body>
</html>`;
};

async function main() {
  const posts = loadPosts();
  const topic = pickTopic(posts);
  console.log(`Temat tej tury: "${topic}" — generuję w ${LANGS.length} językach...`);

  for (const lang of LANGS) {
    try {
      const { translatedTitle, body } = await generateArticle(topic, lang);
      const slug = slugify(translatedTitle || topic) + "-" + Date.now().toString().slice(-5) + ".html";
      const dir = path.join("blog", lang.code);
      fs.mkdirSync(dir, { recursive: true });
      const html = TEMPLATE(translatedTitle, body, lang).replace("__SLUG__", slug);
      fs.writeFileSync(path.join(dir, slug), html);

      posts.unshift({
        title: translatedTitle,
        topicKey: topic,
        lang: lang.code,
        url: `blog/${lang.code}/${slug}`,
        date: new Date().toISOString().slice(0, 10),
      });
      console.log(`  [${lang.code}] OK: ${translatedTitle} -> ${slug}`);
    } catch (err) {
      console.error(`  [${lang.code}] BŁĄD:`, err.message);
    }
  }

  fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));
  console.log("Gotowe — zapisano posts.json");
}

main().catch(err => { console.error(err); process.exit(1); });
