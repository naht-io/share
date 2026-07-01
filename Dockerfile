FROM oven/bun:1.3.14-alpine AS development-dependencies-env
COPY package.json bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.14-alpine AS production-dependencies-env
COPY package.json bun.lock /app/
WORKDIR /app
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS build-env
# react-router's build CLI is a Node program (#!/usr/bin/env node); `bun run build`
# delegates to Node via that shebang. Node is needed here because Bun's runtime
# trips over @babel/traverse's CJS interop during the route-export transform.
RUN apk add --no-cache nodejs
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
ENV DB_FILE_NAME=share.db
RUN bun run build
# Create the SQLite schema (drizzle-kit is a dev-only tool, so run it here in the
# build stage) and carry the initialized DB file into the runtime image.
RUN bunx drizzle-kit push --force

# Runtime needs Node: the app's DB layer uses drizzle-orm/node-sqlite, which
# imports the Node built-in `node:sqlite` (not available in the Bun runtime).
FROM node:24-alpine
COPY package.json bun.lock /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/share.db /app/share.db
WORKDIR /app
ENV DB_FILE_NAME=share.db
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
