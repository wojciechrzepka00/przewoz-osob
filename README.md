# Blog — Przewóz osób Kraków

Statyczny blog dla przewoz-osob-krakow.pl (Legendary Kraków), hostowany na
subdomenie `blog.przewoz-osob-krakow.pl`. Treść generuje automatycznie GitHub
Action (`auto-blog.yml`) przez API Anthropic (`ANTHROPIC_API_KEY` w sekretach
repo), co 3 dni, w 4 językach (PL/EN/ES/UK). Serwer robi `git pull` co 30 min.

- `auto-blog/generate-article.mjs` — generator (bez zależności npm, natywny fetch)
- `index.html` — lista artykułów (czyta `posts.json`)
- `blog/{lang}/*.html` — wygenerowane artykuły
- Artykuły mają linki wsteczne do przewoz-osob-krakow.pl (SEO)
