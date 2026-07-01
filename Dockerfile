FROM oven/bun:1.3.14-alpine AS development-dependencies-env
COPY package.json bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14-alpine AS production-dependencies-env
COPY package.json bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
ENV DB_FILE_NAME=share.db
RUN bun run build
# Create the SQLite schema (drizzle-kit is a dev-only tool, so run it here in the
# build stage) and carry the initialized DB file into the runtime image. With no
# Node present, drizzle-kit runs under Bun and uses the bun:sqlite driver.
RUN bunx drizzle-kit push --force

# Everything runs on the Bun runtime: the app's DB layer uses
# drizzle-orm/bun-sqlite (bun:sqlite) and the SSR entry uses the web-streams
# renderToReadableStream, both of which Bun supports natively.
FROM oven/bun:1.3.14-alpine
COPY package.json bun.lock /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/share.db /app/share.db
WORKDIR /app
ENV DB_FILE_NAME=share.db
EXPOSE 3000
CMD ["bun", "node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
