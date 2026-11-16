# Aavid's portfolio

The site behind **aavidm.com**: a static, single-file-per-concern site with no build step.

- **public/index.html** holds all the content. Each tab (home, experience, projects, contact) is a `<div id="page-…">` block.
- **public/styles.css** holds the theme. The colors are the variables at the top of the file.
- **public/script.js** runs the typewriter intro, tab switching, and the animated signal traces on the project cards.
- **public/assets/** holds the logo, favicon, and project images.

## Preview locally

Serve the folder with any static server:

```
cd public
python -m http.server 8000
```

Then open http://localhost:8000.

## Add a project

Copy one `<article class="card fade-item">` block in the projects page of **public/index.html**, then change the image, title, year, and description. Each `.win` inside `.viz` is one floating window; its position and size come from the inline `top` / `left` / `width` values.

## Deploy

**wrangler.jsonc** serves the **public** folder as Cloudflare Workers static assets. With the repository connected to Cloudflare (Workers & Pages → the project → Settings → Builds), every push to **main** deploys. To deploy by hand:

```
npx wrangler deploy
```

## The worker

**src/worker.js** runs in front of the static files. It redirects mathrawala.com to aavidm.com and serves **/api/today**, which the home page uses for "calendar for today". That endpoint reads TickTick with a token stored as a Cloudflare secret, so the token is never in this repository or in the page. To change the token:

```
npx wrangler secret put TICKTICK_TOKEN
```
