FROM node:22-alpine AS build
WORKDIR /app

# /api is a relative path, Nginx proxies it to the backend container.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/
RUN echo "VITE_API_URL=${VITE_API_URL}" > ./frontend/.env && \
    cd frontend && npx vite build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
