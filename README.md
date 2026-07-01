# Share

**Share anything. On your terms.**

## Deploy with Docker Compose

```yaml
services:
  share:
    image: ghcr.io/naht-io/share:latest
    ports:
      - "3000:3000"
    volumes:
      - share-data:/data
    restart: unless-stopped

volumes:
  share-data:
```

```bash
docker compose up -d
```

## Deploy with Docker

```bash
docker run -d -p 3000:3000 -v share-data:/data ghcr.io/naht-io/share:latest
```

## Development

Requires [Bun](https://bun.sh).

```bash
bun install  # install dependencies
bun run dev  # start the dev server at http://localhost:5173
```

---

Built with 💖 by nath.io
