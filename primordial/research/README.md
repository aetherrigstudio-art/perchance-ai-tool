# research/

- `findings/` — full verbatim deep-research reports (added during build).
- `corpus/` — curated Claude best-use + RAG core (committed subset of a 4,861-doc scrape).
- `corpus-full/` — full 41.6 MB scrape (gitignored; regenerate with `scripts/crawl-site.py`).
- `scripts/` — `scrape-blog.py` (blog only) and `crawl-site.py` (full site → merged corpus).

Regenerate full corpus: `python3 scripts/crawl-site.py` (no API key; stdlib only).
