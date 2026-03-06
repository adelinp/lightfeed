# LightFeed

LightFeed is an open-source, self-hosted RSS reader focused on **speed**, **low operational overhead**, and **user-controlled feed composition**.

It lets you combine multiple RSS sources into custom feeds and keeps storage lightweight by saving **configuration in SQLite** while keeping **user bookmarks in the browser**.

![LightFeed Screenshot](./public/images/the-feed.png)

## Why this project exists

- Fast, readable RSS experience without algorithmic timelines
- Full control over feed sources
- Local-first persistence with minimal moving parts
- No tracking or telemetry
- Very small operational footprint

## Features

- Create multiple named feeds (example: `World News`, `Business`, `Sports`)
- Blend RSS sources into one **recency-sorted stream**
- Mark one feed as the **homepage**
- Save and remove bookmarked articles in the browser
- Filter saved articles by **source**
- Show per-feed fetch failures without hiding successful sources
- Display publisher logos automatically
- Support multiple feeds from the same publisher as distinct sources
- Keep article fetching live (articles are not fully persisted)

## Tech stack

- Next.js App Router (`src/app`)
- React
- SQLite via built-in `node:sqlite`
- Tailwind CSS v4

## Install

### 1. Install Node.js

Use **Node.js 22 or newer**.

LightFeed uses `node:sqlite`, which is only available in newer Node versions.

Check your version:

```bash
node -v
```

Install Node from [nodejs.org](https://nodejs.org/).

### 2. Clone the project

```bash
git clone <your-repo-url>
cd lightfeed
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create `.env.local`

Example:

```bash
NEXT_PUBLIC_LOGO_DEV_TOKEN=your_logo_dev_token
NEXT_PUBLIC_LOGO_DOMAIN_OVERRIDES=feeds.content.dowjones.io=wsj.com
ADMIN_SECRET=your_random_admin_secret
```

#### `NEXT_PUBLIC_LOGO_DEV_TOKEN`

Optional token for [logo.dev](https://logo.dev/).

Used to fetch publisher logos.

Without it, logos may still work, but with lower reliability.

#### `NEXT_PUBLIC_LOGO_DOMAIN_OVERRIDES`

Optional mapping to override logo domains.

Example:

```bash
feeds.content.dowjones.io=wsj.com
```

This fixes feeds where the RSS hostname does not match the publisher domain.

Multiple overrides can be added:

```bash
feeds.content.dowjones.io=wsj.com,example.feed.com=example.com
```

#### `ADMIN_SECRET`

Shared secret used by middleware to protect admin routes.

This must match the header injected by Cloudflare.

### 5. Database path

By default SQLite is stored at:

```bash
~/.lightfeed/data/lightfeed.sqlite
```

You can override it with:

```bash
LIGHTFEED_DB_PATH=/absolute/path/to/lightfeed.sqlite
```

or:

```bash
LIGHTFEED_DATA_DIR=/absolute/path/to/lightfeed-data
```

Resolution order:

1. `LIGHTFEED_DB_PATH`
2. `LIGHTFEED_DATA_DIR/lightfeed.sqlite`
3. `~/.lightfeed/data/lightfeed.sqlite`

### 6. Start the app

Development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## First run behavior

LightFeed automatically:

- creates the SQLite database
- initializes schema
- creates lightweight seed data if required
- starts fetching RSS feeds immediately

No manual database setup is required.

## Environment variables

Complete list currently used by LightFeed.

### Public variables

```bash
NEXT_PUBLIC_LOGO_DEV_TOKEN
NEXT_PUBLIC_LOGO_DOMAIN_OVERRIDES
```

### Server variables

```bash
ADMIN_SECRET
LIGHTFEED_DB_PATH
LIGHTFEED_DATA_DIR
```

## Common commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deployment

LightFeed runs as a standard **Next.js Node server**.

It works best on:

- VPS
- Docker
- Fly.io
- Railway
- Render
- traditional servers

### Docker deployment

Example `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

Build:

```bash
docker build -t lightfeed .
```

Run:

```bash
docker run -d \
  -p 3000:3000 \
  -v lightfeed_db:/app/data \
  -e LIGHTFEED_DATA_DIR=/app/data \
  -e ADMIN_SECRET=your_secret \
  -e NEXT_PUBLIC_LOGO_DEV_TOKEN=your_token \
  lightfeed
```

## Public site + protected admin

LightFeed is designed to be **public-read / private-admin**.

Public users can browse feeds.  
Admin users can create and edit feeds.

### Public routes

```text
/
/feeds
/feeds/[id]
/saved
```

### Admin routes

```text
/settings
/settings/feeds/new
/settings/feeds/[id]/edit
```

## Middleware protection

Admin routes are protected by middleware.

Protected paths:

```text
/settings/*
/api/feeds/*
/api/preview-feed
```

Middleware checks the header:

```text
x-lightfeed-admin-secret
```

Its value must match:

```text
ADMIN_SECRET
```

If the header is missing or wrong, the app returns:

```text
403 Forbidden
```

## Cloudflare protection for `/settings`

The simplest setup is:

- keep the site public
- protect `/settings` and admin APIs at Cloudflare
- let Cloudflare inject the admin secret header

### Recommended approach

At Cloudflare, create a rule or Worker that injects:

```text
x-lightfeed-admin-secret: YOUR_ADMIN_SECRET
```

Apply it only to:

```text
/settings*
/api/feeds*
/api/preview-feed
```

### Result

Public visitors can access:

```text
/
/feeds
/feeds/[id]
/saved
```

Only requests that pass through your Cloudflare admin protection can access:

```text
/settings*
/api/feeds*
/api/preview-feed
```

## Product model

User-facing term: **Feed**  
Storage term: **Page** (legacy internal naming in SQLite/lib functions)

A feed/page contains:

- `name`
- `is_homepage`
- many RSS sources (through `page_feeds`)

## App routes

### Public

- `/` - homepage/default feed stream
- `/feeds` - feed directory
- `/feeds/[id]` - read a feed stream
- `/saved` - bookmarked articles stored in browser localStorage

### Admin

- `/settings`
- `/settings/feeds/new`
- `/settings/feeds/[id]/edit`

## API routes

- `GET /api/feeds` - list feeds
- `POST /api/feeds` - create feed
- `GET /api/feeds/[feedId]` - feed details + blended stream
- `PATCH /api/feeds/[feedId]` - update feed
- `DELETE /api/feeds/[feedId]` - delete feed
- `POST /api/preview-feed` - preview feed blend before saving

### Protected API routes

The following routes should not be publicly writable:

- `POST /api/feeds`
- `PATCH /api/feeds/[feedId]`
- `DELETE /api/feeds/[feedId]`
- `POST /api/preview-feed`

## Data storage

SQLite file (default):

```text
~/.lightfeed/data/lightfeed.sqlite
```

Primary tables:

- `pages(id, name, is_homepage, sort_order, created_at)`
- `feeds(id, url, title, created_at)`
- `page_feeds(page_id, feed_id)`

LightFeed stores **feed configuration** in SQLite.

RSS article content is fetched live and is not fully persisted.

### Bookmarks

Saved articles are stored in the browser using `localStorage`.

This means:

- bookmarks are per browser/device
- no login is required
- no anonymous bookmark rows accumulate in the server database
- clearing browser storage removes saved articles

## Project structure

- `src/app/*` - routes + server components
- `src/components/*` - reusable UI/client components
- `src/lib/lightfeed-pages.js` - feed/page operations
- `src/lib/lightfeed-db.js` - SQLite schema, migration, seed flow
- `src/lib/rss-parse.js` - RSS/Atom parsing
- `src/lib/rss-blend.js` - recency-first blend logic
- `src/lib/rss-stream.js` - fetch + orchestration
- `src/lib/feed-request.js` - request feed validation
- `src/middleware.js` - admin route protection

## Lightweight-by-default principles

- Keep routes predictable
- Keep API semantics aligned with UI language (`feeds`)
- Avoid duplicated request validation logic
- Avoid storing full article payloads when not needed
- Keep anonymous user state in the browser when possible

## Troubleshooting

- `Cannot find module 'node:sqlite'` or similar:
  - upgrade Node.js to `22+`

- App starts but no articles appear:
  - verify feed URLs are valid RSS/Atom endpoints
  - check per-feed warnings shown in the UI

- Database reset for local development:
  - stop server
  - delete `~/.lightfeed/data/lightfeed.sqlite` (or your custom DB path)
  - restart with `npm run dev`

- `403 Forbidden` on `/settings`:
  - verify `ADMIN_SECRET` is set
  - verify your middleware is enabled
  - verify Cloudflare injects `x-lightfeed-admin-secret`
  - for local development, allow localhost bypass or send the header manually

## Security note

Feed URLs are user-provided and fetched server-side.

If you deploy this publicly, add network controls and outbound restrictions where possible to reduce SSRF and abuse risk.

Also:

- protect `/settings`
- protect write APIs
- do not rely only on hidden links
- restrict admin access at Cloudflare or another reverse proxy layer

## Contributing

Contributions are welcome.

Suggested workflow:

1. Fork/branch from `main`
2. Keep each update small and self-contained
3. Do not include scattered unrelated edits
4. Run `npm run lint`
5. Ensure accessibility remains strong
6. Open a pull request with a clear explanation

Accessibility reference:

- W3C Web Accessibility Initiative (WAI): https://www.w3.org/WAI/
- WCAG standards and guidance: https://www.w3.org/WAI/standards-guidelines/wcag/

Maintainer policy:

- The project owner may decline, ignore, or remove updates to keep the app clean and aligned with its mission
- Changes that move the app away from its mission may not be accepted
- If you want a different direction, feel free to fork the project

## License

MIT. See [LICENSE](./LICENSE).