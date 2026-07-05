FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app

FROM base AS development-dependencies-env
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM base AS production-dependencies-env
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM base AS build-env
COPY --from=development-dependencies-env /app/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base
ENV NODE_ENV=production \
    DB_FILE=/data/share.db \
    FILES_DIR=/data/files
COPY package.json bun.lock ./
COPY --from=production-dependencies-env /app/node_modules node_modules
COPY --from=build-env /app/build build
COPY drizzle drizzle
RUN mkdir -p /data && chown bun:bun /data /app
USER bun
VOLUME /data
EXPOSE 3000
CMD ["bun", "--bun", "react-router-serve", "./build/server/index.js"]
