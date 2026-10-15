# 4KHDHub Stremio Addon

A production-ready, highly-optimized Stremio streaming addon for 4KHDHub, designed for deployment as a serverless function on Vercel.

## Features

- Scrapes streaming links from 4khdhub.one/link with multi-step redirection resolution
- Supports both movies and TV series
- Fuzzy title matching with scoring algorithm
- Parallel hubcloud link resolution
- Upstash Redis caching for improved performance
- Base64-encoded configuration in URL path for user filters
- Vercel serverless optimized with extended timeout

## Deployment on Vercel

1. Fork/clone this repository
2. Install dependencies: `npm install`
3. Configure environment variables in Vercel:
   - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
4. Deploy to Vercel

## Usage

The addon is accessed via URLs with base64-encoded config in the path:

```
https://your-domain.vercel.app/api/[base64-config]/manifest.json
```

For example, with empty config:
```
https://your-domain.vercel.app/api/eyJmaWx0ZXJzIjp7fX0=/manifest.json
```

To install in Stremio, use the manifest URL above.

## How it works

1. Stremio requests stream for an IMDb ID (e.g., `tt1234567` for movies, `tt1234567:1:2` for series)
2. Metadata is fetched from Cinemeta to get the exact title and year
3. 4KHDHub is searched with fuzzy matching to find the best match
4. Hubcloud links are extracted from the movie/series page
5. Links are resolved through multiple redirects to get the final playable URL
6. Results are cached in Upstash Redis (6h for movies, 2h for series)

## Architecture

- `api/[config]/manifest.json.js` - Serves the addon manifest
- `api/[config]/stream/[type]/[id].js` - Handles stream requests
- `lib/cinemeta.js` - Metadata resolution from Cinemeta
- `lib/search.js` - 4KHDHub search with fuzzy scoring
- `lib/links.js` - Hubcloud link extraction
- `lib/hubcloud.js` - Parallel link resolution engine
- `lib/cache.js` - Upstash Redis caching
- `vercel.json` - Vercel configuration with extended timeout

## Dependencies

- stremio-addon-sdk
- axios
- cheerio
- @upstash/redis
