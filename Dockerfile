FROM node:26-alpine

RUN apk add --no-cache curl jq

WORKDIR /app

# # Install package dependencies
# COPY package*.json ./
# RUN npm install

# RUN echo "0 3 * * 0 /scripts/download-botc-data.sh >> /var/log/botc-download.log 2>&1" \
#     > /etc/crontabs/root