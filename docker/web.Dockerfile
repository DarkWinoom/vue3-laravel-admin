FROM node:24-alpine AS build
RUN npm install --global pnpm@11.5.0
WORKDIR /app/frontend
COPY frontend/ ./
COPY .env.example /app/.env
RUN pnpm install --frozen-lockfile
ARG VITE_SERVICE_BASE_URL=/proxy-default
ENV VITE_SERVICE_BASE_URL=$VITE_SERVICE_BASE_URL
ARG FRONTEND_ENV
RUN if [ -n "$FRONTEND_ENV" ]; then printf '%s\n' "$FRONTEND_ENV" > /app/.env; fi \
    && pnpm build

FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist/ /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
