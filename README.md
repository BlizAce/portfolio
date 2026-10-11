# shane-chapman-portfolio

Static portfolio site — no build step, no dependencies, all assets self-contained.

## Deploy to GitLab Pages

1. Create a new (blank) project and push this folder's contents to it:
   ```sh
   cd portfolio-site
   git init && git remote add origin <your-gitlab-url>/portfolio.git
   git add . && git commit -m "portfolio site" && git push -u origin main
   ```
2. The included `.gitlab-ci.yml` publishes everything under `public/`.
3. Site appears at `https://<namespace>.pages.<domain>/portfolio/` (project pages URL).

All paths are relative, so it works at the domain root or under a subpath.

## Local preview

```sh
python3 -m http.server 8090
# open http://localhost:8090
```

## Regenerating demo GIFs

The four Penguin Command scenes and the Spider Net flow animation are rendered
by `../tools/make_gifs.py` (PIL frames → ffmpeg palette-optimised GIF). Posters
(`*-poster.png`) are auto-saved for the no-motion fallback.
