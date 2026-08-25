FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
COPY scripts ./scripts

ARG VITE_API_URL=/v1
ARG VITE_SHOP_TIMEZONE=America/Sao_Paulo
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SHOP_TIMEZONE=$VITE_SHOP_TIMEZONE

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
