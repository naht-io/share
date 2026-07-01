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
RUN bun run build

FROM oven/bun:1.3.14-alpine
COPY package.json bun.lock /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY drizzle /app/drizzle
WORKDIR /app
ENV DB_FILE=/data/share.db
VOLUME /data
EXPOSE 3000
CMD ["bun", "node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
