# IDF Video Dataset

Public catalog for IDF Spokesperson video metadata scraped from Telegram (`scraper.py`) into `output.csv`, with a **Next.js** web app under [`web/`](web/) for search, category pillars, Azure CDN streaming links, and CSV export.

## Web app

```bash
cd web
npm install
npm run dev
```

- **Data refresh:** place an updated `output.csv` at the repo root, then:

  ```bash
  cd web && npm run data:build
  ```

  This regenerates `web/src/data/videos.json`. `npm run build` runs `data:build` automatically via `prebuild`.

- **Production URL:** set `SITE_URL` (e.g. `https://your-domain.vercel.app`) in Vercel for canonical URLs, Open Graph, and `sitemap.xml`.

## Deploy on Vercel

1. Import this repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `web`.
3. Add environment variable `SITE_URL` to your deployment URL.
4. Deploy. Static pages (thousands of video and category URLs) are generated at build time.

## Repository layout

| Path | Purpose |
|------|---------|
| `output.csv` | Scraped dataset (source for `videos.json`) |
| `scraper.py` | Telegram / Bitly / GPT classification pipeline |
| `web/` | Next.js 16 app (browse, video pages, SEO, export API) |

## License

Data originates from public IDF Spokesperson releases; respect their terms of use when redistributing footage or metadata.
