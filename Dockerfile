# # Install package dependencies
FROM node:26-alpine AS base

RUN apk add --no-cache curl jq

WORKDIR /app


# Build only
FROM base AS prod

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Comment to disable cron
RUN echo "0 0 * * 0 /bin/sh /app/scripts/download-botc-data.sh" \
    > /etc/crontabs/root

CMD ["sh", "-c", "crond && exec node .output/server/index.mjs"]