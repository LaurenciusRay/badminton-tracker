FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV TZ=Asia/Jakarta NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Jakarta NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app /app
RUN mkdir -p data && chown node:node data
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && exec ./node_modules/.bin/next start"]
