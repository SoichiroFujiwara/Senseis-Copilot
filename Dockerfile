# syntax=docker/dockerfile:1
ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS dev
WORKDIR /app

# ポートは Vite のデフォルト
EXPOSE 5173

# docker-compose 側で "npm install" を実行する運用にする
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0"]

