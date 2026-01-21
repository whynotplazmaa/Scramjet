FROM node:18-alpine

ENV NODE_ENV=production
ARG NPM_BUILD="npm install --omit=dev"
EXPOSE 8080/tcp

LABEL maintainer="Mercury Workshop"
LABEL summary="Scramjet Demo Image"
LABEL description="Example application of Scramjet"

WORKDIR /app

COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN apk add --upgrade --no-cache python3 make g++ && npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

COPY . .

RUN npm run build

ENTRYPOINT [ "node" ]
CMD ["server.js"]
