FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

FROM base AS release
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs
RUN apt-get update && apt-get install git -y && apt-get install -y docker.io && apt-get install docker-compose -y

RUN usermod -aG docker bunjs

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/traefik /etc/traefik
COPY --from=prerelease /usr/src/app/traefik/server-app.yml /etc/traefik/dynamic/server-app.yml
RUN chown -R bunjs:nodejs /usr/src/app
RUN mkdir -p /usr/src/app/tmp
RUN chmod -R 777 /usr/src/app/tmp


RUN chmod 777 /var/run
USER root
RUN chmod 777 /var/run
USER bunjs
ENV DOCKER_HOST=unix:///var/run/docker.sock
# run the app
EXPOSE 7070
ENV NODE_ENV=production
ENTRYPOINT [ "bun", "run", "src/index.ts" ]