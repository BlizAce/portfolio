# shane-chapman-portfolio

Static portfolio site — no build step, no dependencies, all assets self-contained.

**Live:** https://blizace.github.io/portfolio/

## Deploying

### GitHub Pages (primary — public)
Pages is enabled for deploys from the `main` branch root. Push and it publishes:
```sh
git add . && git commit -m "update" && git push
```

### GitLab (internal server only — not public-facing)
The `.gitlab-ci.yml` publishes to `public/` on the internal instance; the file is
git-ignored for GitHub so it never ships there.

All paths are relative, so the site works at a domain root or under any subpath.

## Local preview

```sh
python3 -m http.server 8090   # open http://localhost:8090
```

## Papers

Downloadable PDFs live in `assets/papers/`, generated from the research markdown
with pandoc + weasyprint (styles: see header of any build). Regenerate with:
```sh
pandoc PAPER.md -f markdown+tex_math_dollars+pipe_tables --standalone \
  --embed-resources --resource-path=. -c paper.css -M title="…" -o out.html
weasyprint out.html chapman-YYYY-slug.pdf
```

## Demo GIFs

The four Penguin Command scenes and the Spider Net flow animation are rendered by
`../tools/make_gifs.py` (PIL frames → ffmpeg palette-optimised GIF). Posters
(`*-poster.png`) are auto-saved for the no-motion fallback.
