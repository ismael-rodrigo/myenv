FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY prisma /temp/prod/prisma
COPY --from=node:18 /usr/local/bin/node /usr/local/bin/node

RUN cd /temp/prod && \
    bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

FROM base AS release
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs
RUN apt-get update && apt-get install -y git docker.io curl

ENV DOCKER_CONFIG=/usr/local/lib/docker
RUN mkdir -p $DOCKER_CONFIG/cli-plugins
RUN curl -SL https://github.com/docker/compose/releases/download/v2.33.1/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
RUN chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

RUN usermod -aG docker bunjs

RUN mkdir -p /tmp/myenv/projects

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/prisma ./prisma
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json /usr/src/app/entrypoint.sh ./

RUN mkdir -p /etc/traefik/dynamic && \
    chown -R bunjs:nodejs /usr/src/app && \
    chown -R bunjs:nodejs /tmp/myenv && \
    chmod -R 777 /tmp/myenv

ENV DOCKER_HOST=unix:///var/run/docker.sock

EXPOSE 7070
ENV NODE_ENV=production
ENV DATABASE_URL="file:/var/lib/myenv/myenv.db"

USER bunjs

ENTRYPOINT [ "./entrypoint.sh" ]